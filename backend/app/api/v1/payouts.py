"""Payout API routes — list (owner), create/update (admin)."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_shop, get_current_user
from app.models.enums import UserRole
from app.models.shop import Shop
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.payout import PayoutCreate, PayoutRead, PayoutStatusUpdate
from app.services import payout_service
from app.services.shop_service import require_shop_owner_or_staff

router = APIRouter(tags=["Payouts"])


def _require_admin(user: User) -> None:
    """Raise 403 if the user is not an admin."""
    from fastapi import HTTPException

    if user.primary_role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )


# --- Shop owner: view payouts ---


@router.get(
    "/shops/{slug}/payouts",
    response_model=PaginatedResponse[PayoutRead],
)
async def list_payouts(
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[PayoutRead]:
    """List payouts for a shop. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    payouts, total = await payout_service.list_payouts(
        db, shop.shop_id, skip, limit
    )
    return PaginatedResponse(
        items=[PayoutRead.model_validate(p) for p in payouts],
        total=total,
        skip=skip,
        limit=limit,
    )


# --- Admin: create and manage payouts ---


@router.post(
    "/admin/payouts",
    response_model=PayoutRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_payout(
    data: PayoutCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PayoutRead:
    """Create a payout for a shop. Admin only."""
    _require_admin(user)
    payout = await payout_service.create_payout(db, data)
    return PayoutRead.model_validate(payout)


@router.patch(
    "/admin/payouts/{payout_id}",
    response_model=PayoutRead,
)
async def update_payout_status(
    payout_id: uuid.UUID,
    data: PayoutStatusUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PayoutRead:
    """Update payout status. Admin only."""
    _require_admin(user)
    payout = await payout_service.update_payout_status(db, payout_id, data)
    return PayoutRead.model_validate(payout)
