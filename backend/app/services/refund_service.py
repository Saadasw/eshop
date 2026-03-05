"""Refund service — request, approve, reject, process refunds."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.state_machines import VALID_REFUND_TRANSITIONS, validate_transition
from app.models.enums import NotificationType, OrderStatus, RefundStatus
from app.models.order import Order, OrderItem
from app.models.payment import Refund, RefundItem
from app.models.product import ProductVariant
from app.schemas.refund import RefundRequest, RefundStatusUpdate
from app.services import notification_service


async def request_refund(
    db: AsyncSession,
    order_id: uuid.UUID,
    user_id: uuid.UUID,
    data: RefundRequest,
) -> Refund:
    """Create a refund request for an order. Customer only.

    Args:
        db: Async database session.
        order_id: UUID of the order.
        user_id: UUID of the customer requesting the refund.
        data: Refund request data with items and reason.

    Returns:
        Created Refund record.

    Raises:
        HTTPException 404: If order not found.
        HTTPException 400: If order is not eligible for refund.
        HTTPException 400: If item quantities exceed order item quantities.
    """
    # Fetch order with items
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(
            Order.order_id == order_id,
            Order.customer_id == user_id,
            Order.deleted_at.is_(None),
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # Only delivered or shipped orders can be refunded
    if order.status not in (OrderStatus.DELIVERED, OrderStatus.SHIPPED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot request refund for order with status '{order.status.value}'",
        )

    # Build a map of order items for validation
    order_items_map: dict[uuid.UUID, OrderItem] = {
        item.item_id: item for item in order.items
    }

    # Validate and calculate refund amount
    refund_items: list[RefundItem] = []
    total_refund = Decimal("0")

    for req_item in data.items:
        order_item = order_items_map.get(req_item.order_item_id)
        if not order_item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order item {req_item.order_item_id} not found in this order",
            )

        if req_item.quantity > order_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Refund quantity ({req_item.quantity}) exceeds order item "
                    f"quantity ({order_item.quantity}) for item {req_item.order_item_id}"
                ),
            )

        # Calculate per-item refund amount (proportional to unit price)
        item_amount = order_item.unit_price_snapshot * req_item.quantity
        total_refund += item_amount

        refund_items.append(
            RefundItem(
                order_item_id=req_item.order_item_id,
                quantity=req_item.quantity,
                amount=item_amount,
            )
        )

    # Create refund record
    refund = Refund(
        order_id=order_id,
        requested_by=user_id,
        type=data.type,
        amount=total_refund,
        reason=data.reason,
        status=RefundStatus.REQUESTED,
    )
    db.add(refund)
    await db.flush()

    # Assign refund_id to items and add them
    for item in refund_items:
        item.refund_id = refund.refund_id
    db.add_all(refund_items)

    # Notify shop owner
    await notification_service.create_notification(
        db,
        user_id=order.shop.owner_id if hasattr(order, "shop") and order.shop else user_id,
        type=NotificationType.REFUND_UPDATE,
        title="New Refund Request",
        message=f"Refund requested for order #{order.order_number} — ৳{total_refund}",
        shop_id=order.shop_id,
        reference_id=refund.refund_id,
        reference_type="refund",
    )

    await db.commit()
    await db.refresh(refund)
    return refund


async def list_refunds(
    db: AsyncSession,
    shop_id: uuid.UUID,
    skip: int = 0,
    limit: int = 20,
    status_filter: RefundStatus | None = None,
) -> tuple[list[Refund], int]:
    """List refunds for a shop with pagination. Owner/staff only.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        skip: Offset for pagination.
        limit: Max results.
        status_filter: Optional filter by refund status.

    Returns:
        Tuple of (refunds with items, total count).
    """
    # Join through order to filter by shop
    base = (
        select(Refund)
        .join(Order, Refund.order_id == Order.order_id)
        .where(Order.shop_id == shop_id)
    )

    if status_filter:
        base = base.where(Refund.status == status_filter)

    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        base.options(selectinload(Refund.items))
        .order_by(Refund.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().unique().all()), total


async def get_refund(
    db: AsyncSession,
    refund_id: uuid.UUID,
    shop_id: uuid.UUID,
) -> Refund:
    """Get a single refund by ID, scoped to a shop.

    Args:
        db: Async database session.
        refund_id: UUID of the refund.
        shop_id: UUID of the shop.

    Returns:
        Refund instance with items loaded.

    Raises:
        HTTPException 404: If refund not found.
    """
    result = await db.execute(
        select(Refund)
        .options(selectinload(Refund.items))
        .join(Order, Refund.order_id == Order.order_id)
        .where(
            Refund.refund_id == refund_id,
            Order.shop_id == shop_id,
        )
    )
    refund = result.scalar_one_or_none()
    if not refund:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Refund not found",
        )
    return refund


async def update_refund_status(
    db: AsyncSession,
    refund_id: uuid.UUID,
    shop_id: uuid.UUID,
    processed_by: uuid.UUID,
    data: RefundStatusUpdate,
) -> Refund:
    """Update refund status with state machine validation. Owner/staff only.

    Args:
        db: Async database session.
        refund_id: UUID of the refund.
        shop_id: UUID of the shop.
        processed_by: UUID of the user processing the refund.
        data: Status update data.

    Returns:
        Updated Refund.

    Raises:
        HTTPException 400: If the status transition is invalid.
    """
    refund = await get_refund(db, refund_id, shop_id)

    if not validate_transition(refund.status, data.status, VALID_REFUND_TRANSITIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from '{refund.status.value}' to '{data.status.value}'",
        )

    now = datetime.now(timezone.utc)
    refund.status = data.status
    refund.processed_by = processed_by

    if data.admin_note:
        refund.admin_note = data.admin_note

    if data.status == RefundStatus.PROCESSING:
        refund.processed_at = now
    elif data.status == RefundStatus.COMPLETED:
        refund.completed_at = now

    # Restock items if requested and status is approved or completed
    if data.restock and data.status in (RefundStatus.APPROVED, RefundStatus.COMPLETED):
        await _restock_items(db, refund)

    # Notify customer
    await notification_service.create_notification(
        db,
        user_id=refund.requested_by,
        type=NotificationType.REFUND_UPDATE,
        title="Refund Update",
        message=f"Your refund request has been {data.status.value}",
        reference_id=refund.refund_id,
        reference_type="refund",
    )

    await db.commit()
    await db.refresh(refund)
    return refund


async def _restock_items(db: AsyncSession, refund: Refund) -> None:
    """Restock variant inventory for refund items that haven't been restocked yet.

    Args:
        db: Async database session.
        refund: The refund with items loaded.
    """
    for item in refund.items:
        if item.restocked:
            continue

        # Get the variant via the order item
        oi_result = await db.execute(
            select(OrderItem.variant_id).where(
                OrderItem.item_id == item.order_item_id
            )
        )
        variant_id = oi_result.scalar_one_or_none()
        if not variant_id:
            continue

        variant_result = await db.execute(
            select(ProductVariant).where(
                ProductVariant.variant_id == variant_id
            )
        )
        variant = variant_result.scalar_one_or_none()
        if variant:
            variant.stock_quantity += item.quantity
            item.restocked = True
