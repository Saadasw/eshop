"""Pydantic schemas for order operations."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import (
    FulfillmentType,
    OrderEventType,
    OrderItemStatus,
    OrderPaymentStatus,
    OrderStatus,
)


# --- Order Creation (from cart) ---


class OrderCreate(BaseModel):
    """Request body for creating an order from the current cart."""

    delivery_address_id: uuid.UUID | None = None
    delivery_zone_id: uuid.UUID | None = None
    fulfillment_type: FulfillmentType = FulfillmentType.DELIVERY
    coupon_code: str | None = Field(None, max_length=50)
    customer_note: str | None = None


# --- Order Status Update ---


class OrderStatusUpdate(BaseModel):
    """Request body for updating order status."""

    status: OrderStatus
    description: str | None = Field(None, max_length=500)


class OrderCancelRequest(BaseModel):
    """Request body for cancelling an order."""

    cancel_reason: str | None = Field(None, max_length=500)


# --- Order Item Read ---


class OrderItemRead(BaseModel):
    """Order item representation with snapshot data."""

    item_id: uuid.UUID
    variant_id: uuid.UUID
    product_name_snapshot: str
    variant_name_snapshot: str | None = None
    sku_snapshot: str
    image_url_snapshot: str | None = None
    quantity: int
    unit_price_snapshot: Decimal
    discount_amount: Decimal
    line_total: Decimal
    status: OrderItemStatus

    model_config = {"from_attributes": True}


# --- Order Status History ---


class OrderStatusHistoryRead(BaseModel):
    """Order status change record."""

    history_id: uuid.UUID
    from_status: OrderStatus | None = None
    to_status: OrderStatus
    event_type: OrderEventType
    description: str | None = None
    changed_by: uuid.UUID
    changed_at: datetime

    model_config = {"from_attributes": True}


# --- Order Read ---


class OrderRead(BaseModel):
    """Full order representation."""

    order_id: uuid.UUID
    order_number: str
    shop_id: uuid.UUID
    customer_id: uuid.UUID
    status: OrderStatus
    payment_status: OrderPaymentStatus
    fulfillment_type: FulfillmentType
    subtotal: Decimal
    delivery_fee: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    customer_note: str | None = None
    shop_note: str | None = None
    tracking_number: str | None = None
    delivery_partner: str | None = None
    coupon_code_snapshot: str | None = None
    delivery_address_snapshot: dict | None = None
    delivery_zone_name_snapshot: str | None = None
    cancel_reason: str | None = None
    ordered_at: datetime
    confirmed_at: datetime | None = None
    processing_at: datetime | None = None
    ready_at: datetime | None = None
    shipped_at: datetime | None = None
    delivered_at: datetime | None = None
    cancelled_at: datetime | None = None
    items: list[OrderItemRead] = []

    model_config = {"from_attributes": True}


class OrderSummaryRead(BaseModel):
    """Lightweight order representation for listings."""

    order_id: uuid.UUID
    order_number: str
    shop_id: uuid.UUID
    status: OrderStatus
    payment_status: OrderPaymentStatus
    total_amount: Decimal
    item_count: int = 0
    ordered_at: datetime

    model_config = {"from_attributes": True}
