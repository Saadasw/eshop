"""Wishlist service — add, remove, list wishlist items."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.cart import Wishlist
from app.models.product import Product, ProductMedia


async def add_to_wishlist(
    db: AsyncSession,
    user_id: uuid.UUID,
    product_id: uuid.UUID,
    shop_id: uuid.UUID,
) -> Wishlist:
    """Add a product to the user's wishlist.

    Args:
        db: Async database session.
        user_id: UUID of the authenticated user.
        product_id: UUID of the product.
        shop_id: UUID of the shop.

    Returns:
        Created Wishlist entry.

    Raises:
        HTTPException 404: If product not found.
        HTTPException 409: If product already in wishlist.
    """
    # Verify product exists and is active
    product_result = await db.execute(
        select(Product).where(
            Product.product_id == product_id,
            Product.shop_id == shop_id,
            Product.is_active.is_(True),
            Product.deleted_at.is_(None),
        )
    )
    if not product_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    # Check for duplicate
    existing = await db.execute(
        select(Wishlist).where(
            Wishlist.user_id == user_id,
            Wishlist.product_id == product_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product already in wishlist",
        )

    item = Wishlist(
        user_id=user_id,
        product_id=product_id,
        shop_id=shop_id,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def list_wishlist(
    db: AsyncSession,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[dict], int]:
    """List wishlist items with denormalized product info.

    Args:
        db: Async database session.
        user_id: UUID of the authenticated user.
        skip: Offset for pagination.
        limit: Max results.

    Returns:
        Tuple of (wishlist items with product info, total count).
    """
    from sqlalchemy import func

    # Count total
    count_result = await db.execute(
        select(func.count()).where(Wishlist.user_id == user_id)
    )
    total = count_result.scalar() or 0

    # Fetch items with product data
    result = await db.execute(
        select(Wishlist)
        .options(joinedload(Wishlist.product))
        .where(Wishlist.user_id == user_id)
        .order_by(Wishlist.added_at.desc())
        .offset(skip)
        .limit(limit)
    )
    items = list(result.scalars().unique().all())

    # Build response with denormalized product info
    enriched = []
    for item in items:
        product = item.product
        # Get primary image
        image_result = await db.execute(
            select(ProductMedia.file_url).where(
                ProductMedia.product_id == product.product_id,
                ProductMedia.is_primary.is_(True),
            )
        )
        image_url = image_result.scalar_one_or_none()

        enriched.append({
            "wishlist_id": item.wishlist_id,
            "user_id": item.user_id,
            "product_id": item.product_id,
            "shop_id": item.shop_id,
            "added_at": item.added_at,
            "product_name": product.name if product else None,
            "product_slug": product.slug if product else None,
            "product_image": image_url,
            "min_price": product.min_price if product else None,
            "max_price": product.max_price if product else None,
            "is_active": product.is_active if product else False,
        })

    return enriched, total


async def remove_from_wishlist(
    db: AsyncSession,
    user_id: uuid.UUID,
    wishlist_id: uuid.UUID,
) -> None:
    """Remove a product from the user's wishlist.

    Args:
        db: Async database session.
        user_id: UUID of the authenticated user.
        wishlist_id: UUID of the wishlist entry.

    Raises:
        HTTPException 404: If wishlist entry not found.
    """
    result = await db.execute(
        select(Wishlist).where(
            Wishlist.wishlist_id == wishlist_id,
            Wishlist.user_id == user_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist item not found",
        )

    await db.delete(item)
    await db.commit()
