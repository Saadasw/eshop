"""Coupon API routes — CRUD and validation."""

import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_shop, get_current_user
from app.models.shop import Shop
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.coupon import (
    CouponCreate,
    CouponRead,
    CouponUpdate,
    CouponValidateRequest,
    CouponValidateResponse,
)
from app.services import coupon_service
from app.services.shop_service import require_shop_owner_or_staff

router = APIRouter(tags=["Coupons"])


# --- Shop owner/staff: CRUD ---


@router.post(
    "/shops/{slug}/coupons",
    response_model=CouponRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_coupon(
    data: CouponCreate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CouponRead:
    """Create a new coupon for a shop. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    coupon = await coupon_service.create_coupon(db, shop.shop_id, user.user_id, data)
    return CouponRead.model_validate(coupon)


@router.get(
    "/shops/{slug}/coupons",
    response_model=PaginatedResponse[CouponRead],
)
async def list_coupons(
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    is_active: bool | None = None,
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[CouponRead]:
    """List coupons for a shop. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    coupons, total = await coupon_service.list_coupons(
        db, shop.shop_id, skip, limit, is_active
    )
    return PaginatedResponse(
        items=[CouponRead.model_validate(c) for c in coupons],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/shops/{slug}/coupons/{coupon_id}",
    response_model=CouponRead,
)
async def get_coupon(
    coupon_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CouponRead:
    """Get a single coupon. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    coupon = await coupon_service.get_coupon(db, coupon_id, shop.shop_id)
    return CouponRead.model_validate(coupon)


@router.patch(
    "/shops/{slug}/coupons/{coupon_id}",
    response_model=CouponRead,
)
async def update_coupon(
    coupon_id: uuid.UUID,
    data: CouponUpdate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CouponRead:
    """Update a coupon. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    coupon = await coupon_service.update_coupon(db, coupon_id, shop.shop_id, data)
    return CouponRead.model_validate(coupon)


@router.delete(
    "/shops/{slug}/coupons/{coupon_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_coupon(
    coupon_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Soft-delete a coupon. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    await coupon_service.delete_coupon(db, coupon_id, shop.shop_id, user.user_id)


# --- Customer: validate coupon ---


@router.post(
    "/shops/{slug}/coupons/validate",
    response_model=CouponValidateResponse,
)
async def validate_coupon(
    data: CouponValidateRequest,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    cart_subtotal: Decimal = Query(..., gt=0, description="Cart subtotal for validation"),
    db: AsyncSession = Depends(get_db),
) -> CouponValidateResponse:
    """Validate a coupon code against the current cart. Requires authentication."""
    try:
        coupon, discount = await coupon_service.validate_coupon(
            db, shop.shop_id, data.code, user.user_id, cart_subtotal
        )
        return CouponValidateResponse(
            valid=True,
            coupon=CouponRead.model_validate(coupon),
            discount_amount=discount,
            message="Coupon is valid",
        )
    except Exception as e:
        return CouponValidateResponse(
            valid=False,
            discount_amount=Decimal("0"),
            message=str(e.detail) if hasattr(e, "detail") else str(e),
        )
