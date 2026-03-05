"""Pydantic schemas for review operations."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# --- Review Create ---


class ReviewCreate(BaseModel):
    """Request body for creating a review."""

    order_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = Field(None, max_length=2000)
    is_anonymous: bool = False


# --- Review Reply ---


class ReviewReply(BaseModel):
    """Request body for shop owner/staff replying to a review."""

    shop_reply: str = Field(..., min_length=1, max_length=2000)


# --- Review Read ---


class ReviewRead(BaseModel):
    """Review representation returned to clients."""

    review_id: uuid.UUID
    product_id: uuid.UUID
    customer_id: uuid.UUID
    order_id: uuid.UUID
    rating: int
    comment: str | None = None
    shop_reply: str | None = None
    replied_at: datetime | None = None
    is_anonymous: bool
    is_refunded_order: bool
    customer_name: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
