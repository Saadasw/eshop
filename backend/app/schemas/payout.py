"""Pydantic schemas for payout operations."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import PayoutMethod, PayoutStatus


class PayoutCreate(BaseModel):
    """Request body for creating a payout (admin only)."""

    shop_id: uuid.UUID
    period_start: datetime
    period_end: datetime
    payout_method: PayoutMethod
    commission_rate: Decimal = Field(
        Decimal("0"), ge=0, le=1, max_digits=5, decimal_places=4
    )
    notes: str | None = None


class PayoutStatusUpdate(BaseModel):
    """Request body for updating payout status (admin)."""

    status: PayoutStatus
    transaction_reference: str | None = None
    notes: str | None = None


class PayoutRead(BaseModel):
    """Payout representation returned to clients."""

    payout_id: uuid.UUID
    shop_id: uuid.UUID
    period_start: datetime
    period_end: datetime
    order_count: int
    gross_amount: Decimal
    commission_rate: Decimal
    commission_amount: Decimal
    refund_deductions: Decimal
    net_amount: Decimal
    status: PayoutStatus
    payout_method: PayoutMethod
    transaction_reference: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    processed_at: datetime | None = None

    model_config = {"from_attributes": True}
