"""Review service — create, list, reply, and soft-delete reviews."""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import OrderStatus
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate


async def create_review(
    db: AsyncSession,
    shop_id: uuid.UUID,
    product_id: uuid.UUID,
    customer_id: uuid.UUID,
    data: ReviewCreate,
) -> Review:
    """Create a review for a product. Customer must have a delivered order containing the product.

    Args:
        db: Async database session.
        shop_id: UUID of the shop (access control).
        product_id: UUID of the product being reviewed.
        customer_id: UUID of the reviewing customer.
        data: Review creation data (order_id, rating, comment, is_anonymous).

    Returns:
        Created Review.

    Raises:
        HTTPException 400: If the order doesn't qualify for a review.
        HTTPException 404: If product not found.
        HTTPException 409: If a review already exists for this product+order+customer.
    """
    # Verify product belongs to shop
    product_result = await db.execute(
        select(Product).where(
            Product.product_id == product_id,
            Product.shop_id == shop_id,
            Product.deleted_at.is_(None),
        )
    )
    if not product_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    # Verify order belongs to customer, is delivered, and contains this product
    order_result = await db.execute(
        select(Order)
        .where(
            Order.order_id == data.order_id,
            Order.customer_id == customer_id,
            Order.shop_id == shop_id,
            Order.status == OrderStatus.DELIVERED,
            Order.deleted_at.is_(None),
        )
        .options(selectinload(Order.items))
    )
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order not found, not delivered, or does not belong to you",
        )

    # Check order contains a variant of this product
    product_variant_ids = {item.variant_id for item in order.items}
    from app.models.product import ProductVariant

    variant_result = await db.execute(
        select(ProductVariant.variant_id).where(
            ProductVariant.product_id == product_id,
            ProductVariant.variant_id.in_(product_variant_ids),
        )
    )
    if not variant_result.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This order does not contain the specified product",
        )

    # Check for existing review (unique constraint: customer_id, product_id, order_id)
    existing = await db.execute(
        select(Review).where(
            Review.customer_id == customer_id,
            Review.product_id == product_id,
            Review.order_id == data.order_id,
            Review.deleted_at.is_(None),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this product for this order",
        )

    review = Review(
        product_id=product_id,
        customer_id=customer_id,
        order_id=data.order_id,
        rating=data.rating,
        comment=data.comment,
        is_anonymous=data.is_anonymous,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


async def list_product_reviews(
    db: AsyncSession,
    shop_id: uuid.UUID,
    product_id: uuid.UUID,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[dict], int]:
    """List visible reviews for a product with customer names.

    Args:
        db: Async database session.
        shop_id: UUID of the shop (access control).
        product_id: UUID of the product.
        skip: Offset for pagination.
        limit: Max results.

    Returns:
        Tuple of (reviews with customer names, total count).
    """
    base = select(Review).where(
        Review.product_id == product_id,
        Review.is_visible.is_(True),
        Review.deleted_at.is_(None),
    )

    # Verify product belongs to shop
    product_result = await db.execute(
        select(Product.product_id).where(
            Product.product_id == product_id,
            Product.shop_id == shop_id,
            Product.deleted_at.is_(None),
        )
    )
    if not product_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        base.options(selectinload(Review.customer))
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    reviews = list(result.scalars().all())

    # Build response with customer names
    review_dicts = []
    for r in reviews:
        review_dict = {
            "review_id": r.review_id,
            "product_id": r.product_id,
            "customer_id": r.customer_id,
            "order_id": r.order_id,
            "rating": r.rating,
            "comment": r.comment,
            "shop_reply": r.shop_reply,
            "replied_at": r.replied_at,
            "is_anonymous": r.is_anonymous,
            "is_refunded_order": r.is_refunded_order,
            "created_at": r.created_at,
            "customer_name": None,
        }
        if not r.is_anonymous and r.customer:
            review_dict["customer_name"] = r.customer.full_name
        review_dicts.append(review_dict)

    return review_dicts, total


async def reply_to_review(
    db: AsyncSession,
    review_id: uuid.UUID,
    shop_id: uuid.UUID,
    reply_text: str,
) -> Review:
    """Add a shop reply to a review.

    Args:
        db: Async database session.
        review_id: UUID of the review.
        shop_id: UUID of the shop (access control via product).
        reply_text: The shop's reply text.

    Returns:
        Updated Review.

    Raises:
        HTTPException 404: If review not found or doesn't belong to this shop.
    """
    review = await _get_review_for_shop(db, review_id, shop_id)
    review.shop_reply = reply_text
    review.replied_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(review)
    return review


async def delete_review(
    db: AsyncSession,
    review_id: uuid.UUID,
    shop_id: uuid.UUID,
    deleted_by: uuid.UUID,
) -> None:
    """Soft-delete a review (shop owner/staff).

    Args:
        db: Async database session.
        review_id: UUID of the review.
        shop_id: UUID of the shop (access control via product).
        deleted_by: UUID of the user performing the delete.
    """
    review = await _get_review_for_shop(db, review_id, shop_id)
    review.deleted_at = datetime.now(timezone.utc)
    review.deleted_by = deleted_by
    await db.commit()


# --- Helpers ---


async def _get_review_for_shop(
    db: AsyncSession,
    review_id: uuid.UUID,
    shop_id: uuid.UUID,
) -> Review:
    """Get a review that belongs to a product in the given shop.

    Args:
        db: Async database session.
        review_id: UUID of the review.
        shop_id: UUID of the shop.

    Returns:
        Review instance.

    Raises:
        HTTPException 404: If review not found or product doesn't belong to shop.
    """
    result = await db.execute(
        select(Review)
        .join(Product, Review.product_id == Product.product_id)
        .where(
            Review.review_id == review_id,
            Product.shop_id == shop_id,
            Review.deleted_at.is_(None),
        )
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )
    return review
