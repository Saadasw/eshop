"""Order API routes — placement, listing, status management."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_shop, get_current_user
from app.models.enums import OrderStatus
from app.models.shop import Shop
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.order import (
    OrderCancelRequest,
    OrderCreate,
    OrderRead,
    OrderStatusUpdate,
    OrderSummaryRead,
)
from app.services import order_service
from app.services.shop_service import require_shop_owner_or_staff

router = APIRouter(tags=["Orders"])


# --- Customer-facing: place order from shop cart ---


@router.post(
    "/shops/{slug}/orders",
    response_model=OrderRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_order(
    data: OrderCreate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderRead:
    """Place an order from the current cart. Requires authentication."""
    order = await order_service.create_order_from_cart(db, shop, user.user_id, data)
    return OrderRead.model_validate(order)


# --- Customer: list own orders across shops ---


@router.get("/orders", response_model=PaginatedResponse[OrderSummaryRead])
async def list_my_orders(
    user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: OrderStatus | None = None,
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[OrderSummaryRead]:
    """List the current user's orders across all shops."""
    orders, total = await order_service.list_customer_orders(
        db, user.user_id, skip, limit, status_filter
    )
    return PaginatedResponse(
        items=[
            OrderSummaryRead(
                **{
                    **OrderSummaryRead.model_validate(o).model_dump(),
                    "item_count": len(o.items),
                }
            )
            for o in orders
        ],
        total=total,
        skip=skip,
        limit=limit,
    )


# --- Customer: get single order ---


@router.get("/orders/{order_id}", response_model=OrderRead)
async def get_my_order(
    order_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderRead:
    """Get a single order detail (customer view)."""
    order = await order_service.get_order(db, order_id, customer_id=user.user_id)
    return OrderRead.model_validate(order)


# --- Customer: cancel own order ---


@router.post("/orders/{order_id}/cancel", response_model=OrderRead)
async def cancel_my_order(
    order_id: uuid.UUID,
    data: OrderCancelRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderRead:
    """Cancel an order (customer). Only allowed for pending/confirmed orders."""
    order = await order_service.cancel_order(
        db,
        order_id,
        cancelled_by=user.user_id,
        cancel_reason=data.cancel_reason,
        customer_id=user.user_id,
    )
    return OrderRead.model_validate(order)


# --- Shop owner/staff: list shop orders ---


@router.get(
    "/shops/{slug}/orders",
    response_model=PaginatedResponse[OrderSummaryRead],
)
async def list_shop_orders(
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: OrderStatus | None = None,
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[OrderSummaryRead]:
    """List orders for a shop. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    orders, total = await order_service.list_shop_orders(
        db, shop.shop_id, skip, limit, status_filter
    )
    return PaginatedResponse(
        items=[
            OrderSummaryRead(
                **{
                    **OrderSummaryRead.model_validate(o).model_dump(),
                    "item_count": len(o.items),
                }
            )
            for o in orders
        ],
        total=total,
        skip=skip,
        limit=limit,
    )


# --- Shop owner/staff: get order detail ---


@router.get("/shops/{slug}/orders/{order_id}", response_model=OrderRead)
async def get_shop_order(
    order_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderRead:
    """Get order detail (shop view). Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    order = await order_service.get_order(db, order_id, shop_id=shop.shop_id)
    return OrderRead.model_validate(order)


# --- Shop owner/staff: update order status ---


@router.patch("/shops/{slug}/orders/{order_id}/status", response_model=OrderRead)
async def update_order_status(
    order_id: uuid.UUID,
    data: OrderStatusUpdate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderRead:
    """Update order status with state machine validation. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    order = await order_service.update_order_status(
        db, order_id, shop.shop_id, data.status, user.user_id, data.description
    )
    return OrderRead.model_validate(order)


# --- Shop owner/staff: cancel order ---


@router.post("/shops/{slug}/orders/{order_id}/cancel", response_model=OrderRead)
async def cancel_shop_order(
    order_id: uuid.UUID,
    data: OrderCancelRequest,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderRead:
    """Cancel an order (shop owner/staff). Restores stock."""
    await require_shop_owner_or_staff(user, shop, db)
    order = await order_service.cancel_order(
        db,
        order_id,
        cancelled_by=user.user_id,
        cancel_reason=data.cancel_reason,
        shop_id=shop.shop_id,
    )
    return OrderRead.model_validate(order)
