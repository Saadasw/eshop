"""Pydantic schemas for refund operations."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import RefundStatus, RefundType


class RefundItemRequest(BaseModel):
    """A single item in a refund request."""

    order_item_id: uuid.UUID
    quantity: int = Field(..., ge=1)


class RefundRequest(BaseModel):
    """Request body for creating a refund request."""

    reason: str = Field(..., min_length=1, max_length=500)
    type: RefundType = RefundType.REFUND
    items: list[RefundItemRequest] = Field(..., min_length=1)


class RefundStatusUpdate(BaseModel):
    """Request body for updating refund status (owner/staff)."""

    status: RefundStatus
    admin_note: str | None = None
    restock: bool = False


class RefundItemRead(BaseModel):
    """Refund item representation."""

    refund_item_id: uuid.UUID
    order_item_id: uuid.UUID
    quantity: int
    amount: Decimal
    restocked: bool

    model_config = {"from_attributes": True}


class RefundRead(BaseModel):
    """Refund representation returned to clients."""

    refund_id: uuid.UUID
    order_id: uuid.UUID
    payment_id: uuid.UUID | None = None
    requested_by: uuid.UUID
    processed_by: uuid.UUID | None = None
    type: RefundType
    amount: Decimal
    reason: str
    status: RefundStatus
    admin_note: str | None = None
    gateway_refund_id: str | None = None
    items: list[RefundItemRead] = []
    created_at: datetime
    updated_at: datetime
    processed_at: datetime | None = None
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}
