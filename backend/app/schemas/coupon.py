"""Pydantic schemas for coupon operations."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator

from app.models.enums import CouponScope, DiscountType


# --- Coupon Create ---


class CouponCreate(BaseModel):
    """Request body for creating a coupon."""

    code: str = Field(..., min_length=1, max_length=50)
    discount_type: DiscountType
    discount_value: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)
    min_order_amount: Decimal | None = Field(None, ge=0, max_digits=12, decimal_places=2)
    max_discount_amount: Decimal | None = Field(
        None, ge=0, max_digits=12, decimal_places=2
    )
    max_usage: int | None = Field(None, ge=1)
    max_usage_per_user: int = Field(1, ge=1)
    applies_to: CouponScope = CouponScope.ALL
    target_category_id: uuid.UUID | None = None
    target_product_id: uuid.UUID | None = None
    valid_from: datetime
    valid_until: datetime

    @model_validator(mode="after")
    def validate_scope_targets(self) -> "CouponCreate":
        """Ensure target IDs match the applies_to scope."""
        if self.applies_to == CouponScope.CATEGORY and not self.target_category_id:
            raise ValueError("target_category_id required when applies_to is 'category'")
        if self.applies_to == CouponScope.PRODUCT and not self.target_product_id:
            raise ValueError("target_product_id required when applies_to is 'product'")
        if self.valid_until <= self.valid_from:
            raise ValueError("valid_until must be after valid_from")
        return self


# --- Coupon Update ---


class CouponUpdate(BaseModel):
    """Request body for updating a coupon."""

    discount_value: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=2)
    min_order_amount: Decimal | None = Field(None, ge=0, max_digits=12, decimal_places=2)
    max_discount_amount: Decimal | None = Field(
        None, ge=0, max_digits=12, decimal_places=2
    )
    max_usage: int | None = Field(None, ge=1)
    max_usage_per_user: int | None = Field(None, ge=1)
    is_active: bool | None = None
    valid_from: datetime | None = None
    valid_until: datetime | None = None


# --- Coupon Read ---


class CouponRead(BaseModel):
    """Coupon representation returned to clients."""

    coupon_id: uuid.UUID
    shop_id: uuid.UUID
    code: str
    discount_type: DiscountType
    discount_value: Decimal
    min_order_amount: Decimal | None = None
    max_discount_amount: Decimal | None = None
    max_usage: int | None = None
    max_usage_per_user: int
    times_used: int
    applies_to: CouponScope
    target_category_id: uuid.UUID | None = None
    target_product_id: uuid.UUID | None = None
    is_active: bool
    valid_from: datetime
    valid_until: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Coupon Validate ---


class CouponValidateRequest(BaseModel):
    """Request body for validating a coupon against a cart."""

    code: str = Field(..., min_length=1, max_length=50)


class CouponValidateResponse(BaseModel):
    """Response for coupon validation."""

    valid: bool
    coupon: CouponRead | None = None
    discount_amount: Decimal = Decimal("0")
    message: str


# --- Coupon Usage Read ---


class CouponUsageRead(BaseModel):
    """Coupon usage record."""

    usage_id: uuid.UUID
    coupon_id: uuid.UUID
    user_id: uuid.UUID
    order_id: uuid.UUID
    discount_applied: Decimal
    used_at: datetime

    model_config = {"from_attributes": True}
