"""Refund API routes — request, list, update status."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_shop, get_current_user
from app.models.enums import RefundStatus
from app.models.shop import Shop
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.refund import RefundRead, RefundRequest, RefundStatusUpdate
from app.services import refund_service
from app.services.shop_service import require_shop_owner_or_staff

router = APIRouter(tags=["Refunds"])


# --- Customer: request refund ---


@router.post(
    "/orders/{order_id}/refund",
    response_model=RefundRead,
    status_code=status.HTTP_201_CREATED,
)
async def request_refund(
    order_id: uuid.UUID,
    data: RefundRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RefundRead:
    """Request a refund for a delivered/shipped order. Customer only."""
    refund = await refund_service.request_refund(db, order_id, user.user_id, data)
    return RefundRead.model_validate(refund)


# --- Shop owner/staff: manage refunds ---


@router.get(
    "/shops/{slug}/refunds",
    response_model=PaginatedResponse[RefundRead],
)
async def list_refunds(
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: RefundStatus | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[RefundRead]:
    """List refunds for a shop. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    refunds, total = await refund_service.list_refunds(
        db, shop.shop_id, skip, limit, status_filter
    )
    return PaginatedResponse(
        items=[RefundRead.model_validate(r) for r in refunds],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/shops/{slug}/refunds/{refund_id}",
    response_model=RefundRead,
)
async def get_refund(
    refund_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RefundRead:
    """Get a single refund. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    refund = await refund_service.get_refund(db, refund_id, shop.shop_id)
    return RefundRead.model_validate(refund)


@router.patch(
    "/shops/{slug}/refunds/{refund_id}",
    response_model=RefundRead,
)
async def update_refund_status(
    refund_id: uuid.UUID,
    data: RefundStatusUpdate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RefundRead:
    """Update refund status (approve, reject, process, complete). Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    refund = await refund_service.update_refund_status(
        db, refund_id, shop.shop_id, user.user_id, data
    )
    return RefundRead.model_validate(refund)
