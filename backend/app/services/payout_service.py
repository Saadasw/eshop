"""Payout service — calculate, create, manage payouts."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.state_machines import VALID_PAYOUT_TRANSITIONS, validate_transition
from app.models.enums import (
    NotificationType,
    OrderStatus,
    PayoutStatus,
    RefundStatus,
)
from app.models.order import Order
from app.models.payment import Payout, Refund
from app.schemas.payout import PayoutCreate, PayoutStatusUpdate
from app.services import notification_service


async def create_payout(
    db: AsyncSession,
    data: PayoutCreate,
) -> Payout:
    """Calculate and create a payout for a shop and period. Admin only.

    Sums delivered order totals, subtracts commission and completed refund amounts
    for the given period.

    Args:
        db: Async database session.
        data: Payout creation data (shop, period, method, commission rate).

    Returns:
        Created Payout record.
    """
    # Calculate gross from delivered orders in period
    gross_result = await db.execute(
        select(
            func.count(Order.order_id),
            func.coalesce(func.sum(Order.total_amount), Decimal("0")),
        ).where(
            Order.shop_id == data.shop_id,
            Order.status == OrderStatus.DELIVERED,
            Order.delivered_at >= data.period_start,
            Order.delivered_at <= data.period_end,
            Order.deleted_at.is_(None),
        )
    )
    row = gross_result.one()
    order_count = row[0] or 0
    gross_amount = Decimal(str(row[1]))

    # Calculate refund deductions (completed refunds in period)
    refund_result = await db.execute(
        select(func.coalesce(func.sum(Refund.amount), Decimal("0")))
        .join(Order, Refund.order_id == Order.order_id)
        .where(
            Order.shop_id == data.shop_id,
            Refund.status == RefundStatus.COMPLETED,
            Refund.completed_at >= data.period_start,
            Refund.completed_at <= data.period_end,
        )
    )
    refund_deductions = Decimal(str(refund_result.scalar() or 0))

    # Calculate commission and net
    commission_amount = (gross_amount * data.commission_rate).quantize(Decimal("0.01"))
    net_amount = gross_amount - commission_amount - refund_deductions

    payout = Payout(
        shop_id=data.shop_id,
        period_start=data.period_start,
        period_end=data.period_end,
        order_count=order_count,
        gross_amount=gross_amount,
        commission_rate=data.commission_rate,
        commission_amount=commission_amount,
        refund_deductions=refund_deductions,
        net_amount=net_amount,
        payout_method=data.payout_method,
        notes=data.notes,
        status=PayoutStatus.PENDING,
    )
    db.add(payout)
    await db.commit()
    await db.refresh(payout)
    return payout


async def list_payouts(
    db: AsyncSession,
    shop_id: uuid.UUID,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[Payout], int]:
    """List payouts for a shop with pagination.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        skip: Offset for pagination.
        limit: Max results.

    Returns:
        Tuple of (payouts, total count).
    """
    base = select(Payout).where(Payout.shop_id == shop_id)

    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        base.order_by(Payout.created_at.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all()), total


async def get_payout(
    db: AsyncSession,
    payout_id: uuid.UUID,
) -> Payout:
    """Get a single payout by ID.

    Args:
        db: Async database session.
        payout_id: UUID of the payout.

    Returns:
        Payout instance.

    Raises:
        HTTPException 404: If payout not found.
    """
    result = await db.execute(
        select(Payout).where(Payout.payout_id == payout_id)
    )
    payout = result.scalar_one_or_none()
    if not payout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payout not found",
        )
    return payout


async def update_payout_status(
    db: AsyncSession,
    payout_id: uuid.UUID,
    data: PayoutStatusUpdate,
) -> Payout:
    """Update payout status with state machine validation. Admin only.

    Args:
        db: Async database session.
        payout_id: UUID of the payout.
        data: Status update data.

    Returns:
        Updated Payout.

    Raises:
        HTTPException 400: If the status transition is invalid.
    """
    payout = await get_payout(db, payout_id)

    if not validate_transition(payout.status, data.status, VALID_PAYOUT_TRANSITIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from '{payout.status.value}' to '{data.status.value}'",
        )

    payout.status = data.status

    if data.transaction_reference:
        payout.transaction_reference = data.transaction_reference
    if data.notes:
        payout.notes = data.notes

    if data.status in (PayoutStatus.COMPLETED, PayoutStatus.FAILED):
        payout.processed_at = datetime.now(timezone.utc)

    # Notify shop owner on completion
    if data.status == PayoutStatus.COMPLETED:
        # Get shop owner_id
        from app.models.shop import Shop

        shop_result = await db.execute(
            select(Shop.owner_id).where(Shop.shop_id == payout.shop_id)
        )
        owner_id = shop_result.scalar_one_or_none()
        if owner_id:
            await notification_service.create_notification(
                db,
                user_id=owner_id,
                type=NotificationType.PAYOUT_COMPLETED,
                title="Payout Completed",
                message=f"Payout of ৳{payout.net_amount} has been completed",
                shop_id=payout.shop_id,
                reference_id=payout.payout_id,
                reference_type="payout",
            )

    await db.commit()
    await db.refresh(payout)
    return payout
