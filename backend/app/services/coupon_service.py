"""Coupon service — CRUD, validation, and application to orders."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.coupon import Coupon, CouponUsage
from app.models.enums import CouponScope, DiscountType
from app.schemas.coupon import CouponCreate, CouponUpdate


async def create_coupon(
    db: AsyncSession,
    shop_id: uuid.UUID,
    created_by: uuid.UUID,
    data: CouponCreate,
) -> Coupon:
    """Create a new coupon for a shop.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        created_by: UUID of the user creating the coupon.
        data: Coupon creation data.

    Returns:
        Created Coupon.

    Raises:
        HTTPException 409: If a coupon with the same code already exists in the shop.
    """
    # Check for duplicate code in the same shop
    existing = await db.execute(
        select(Coupon).where(
            Coupon.shop_id == shop_id,
            Coupon.code == data.code.upper(),
            Coupon.deleted_at.is_(None),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Coupon code '{data.code.upper()}' already exists in this shop",
        )

    coupon = Coupon(
        shop_id=shop_id,
        created_by=created_by,
        code=data.code.upper(),
        discount_type=data.discount_type,
        discount_value=data.discount_value,
        min_order_amount=data.min_order_amount,
        max_discount_amount=data.max_discount_amount,
        max_usage=data.max_usage,
        max_usage_per_user=data.max_usage_per_user,
        applies_to=data.applies_to,
        target_category_id=data.target_category_id,
        target_product_id=data.target_product_id,
        valid_from=data.valid_from,
        valid_until=data.valid_until,
    )
    db.add(coupon)
    await db.commit()
    await db.refresh(coupon)
    return coupon


async def list_coupons(
    db: AsyncSession,
    shop_id: uuid.UUID,
    skip: int = 0,
    limit: int = 20,
    is_active: bool | None = None,
) -> tuple[list[Coupon], int]:
    """List coupons for a shop with pagination.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        skip: Offset for pagination.
        limit: Max results.
        is_active: Optional filter by active status.

    Returns:
        Tuple of (coupons, total count).
    """
    base = select(Coupon).where(
        Coupon.shop_id == shop_id,
        Coupon.deleted_at.is_(None),
    )
    if is_active is not None:
        base = base.where(Coupon.is_active == is_active)

    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        base.order_by(Coupon.created_at.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all()), total


async def get_coupon(
    db: AsyncSession,
    coupon_id: uuid.UUID,
    shop_id: uuid.UUID,
) -> Coupon:
    """Get a single coupon by ID.

    Args:
        db: Async database session.
        coupon_id: UUID of the coupon.
        shop_id: UUID of the shop (access control).

    Returns:
        Coupon instance.

    Raises:
        HTTPException 404: If coupon not found.
    """
    result = await db.execute(
        select(Coupon).where(
            Coupon.coupon_id == coupon_id,
            Coupon.shop_id == shop_id,
            Coupon.deleted_at.is_(None),
        )
    )
    coupon = result.scalar_one_or_none()
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found",
        )
    return coupon


async def update_coupon(
    db: AsyncSession,
    coupon_id: uuid.UUID,
    shop_id: uuid.UUID,
    data: CouponUpdate,
) -> Coupon:
    """Update a coupon's mutable fields.

    Args:
        db: Async database session.
        coupon_id: UUID of the coupon.
        shop_id: UUID of the shop (access control).
        data: Fields to update.

    Returns:
        Updated Coupon.
    """
    coupon = await get_coupon(db, coupon_id, shop_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(coupon, field, value)

    await db.commit()
    await db.refresh(coupon)
    return coupon


async def delete_coupon(
    db: AsyncSession,
    coupon_id: uuid.UUID,
    shop_id: uuid.UUID,
    deleted_by: uuid.UUID,
) -> None:
    """Soft-delete a coupon.

    Args:
        db: Async database session.
        coupon_id: UUID of the coupon.
        shop_id: UUID of the shop (access control).
        deleted_by: UUID of the user performing the delete.
    """
    coupon = await get_coupon(db, coupon_id, shop_id)
    coupon.deleted_at = datetime.now(timezone.utc)
    coupon.deleted_by = deleted_by
    await db.commit()


async def validate_coupon(
    db: AsyncSession,
    shop_id: uuid.UUID,
    code: str,
    user_id: uuid.UUID,
    cart_subtotal: Decimal,
) -> tuple[Coupon, Decimal]:
    """Validate a coupon code and calculate the discount amount.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        code: Coupon code to validate.
        user_id: UUID of the user applying the coupon.
        cart_subtotal: Cart subtotal to check against min_order_amount and to calculate discount.

    Returns:
        Tuple of (coupon, discount_amount).

    Raises:
        HTTPException 400: If the coupon is invalid, expired, or usage limits exceeded.
    """
    result = await db.execute(
        select(Coupon).where(
            Coupon.shop_id == shop_id,
            Coupon.code == code.upper(),
            Coupon.deleted_at.is_(None),
        )
    )
    coupon = result.scalar_one_or_none()
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon not found",
        )

    now = datetime.now(timezone.utc)

    if not coupon.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon is inactive",
        )

    if now < coupon.valid_from:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon is not yet valid",
        )

    if now > coupon.valid_until:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon has expired",
        )

    # Check global usage limit
    if coupon.max_usage is not None and coupon.times_used >= coupon.max_usage:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon usage limit reached",
        )

    # Check per-user usage limit
    user_usage_result = await db.execute(
        select(func.count()).where(
            CouponUsage.coupon_id == coupon.coupon_id,
            CouponUsage.user_id == user_id,
        )
    )
    user_usage = user_usage_result.scalar() or 0
    if user_usage >= coupon.max_usage_per_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already used this coupon the maximum number of times",
        )

    # Check minimum order amount
    if coupon.min_order_amount and cart_subtotal < coupon.min_order_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum order amount is {coupon.min_order_amount}",
        )

    # Calculate discount
    discount = _calculate_discount(coupon, cart_subtotal)
    return coupon, discount


def _calculate_discount(coupon: Coupon, subtotal: Decimal) -> Decimal:
    """Calculate the discount amount for a coupon.

    Args:
        coupon: The coupon to calculate discount for.
        subtotal: The order/cart subtotal.

    Returns:
        Discount amount (never exceeds subtotal).
    """
    if coupon.discount_type == DiscountType.FIXED:
        discount = coupon.discount_value
    else:
        discount = subtotal * coupon.discount_value / Decimal("100")

    # Cap at max_discount_amount
    if coupon.max_discount_amount and discount > coupon.max_discount_amount:
        discount = coupon.max_discount_amount

    # Never exceed subtotal
    if discount > subtotal:
        discount = subtotal

    return discount.quantize(Decimal("0.01"))


async def record_coupon_usage(
    db: AsyncSession,
    coupon_id: uuid.UUID,
    user_id: uuid.UUID,
    order_id: uuid.UUID,
    discount_applied: Decimal,
) -> CouponUsage:
    """Record coupon usage for an order. DB trigger increments times_used.

    Args:
        db: Async database session.
        coupon_id: UUID of the coupon.
        user_id: UUID of the user.
        order_id: UUID of the order.
        discount_applied: Actual discount amount applied.

    Returns:
        Created CouponUsage record.
    """
    usage = CouponUsage(
        coupon_id=coupon_id,
        user_id=user_id,
        order_id=order_id,
        discount_applied=discount_applied,
    )
    db.add(usage)
    return usage
