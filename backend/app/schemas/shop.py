"""Pydantic schemas for shop domain operations."""

import re
import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import (
    DeliveryChargeType,
    PaymentMethod,
    ShopAddressType,
    ShopStatus,
    StaffRole,
)


# --- Shop ---


class ShopCreate(BaseModel):
    """Request body for POST /shops."""

    shop_name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(None, max_length=20)
    trade_license_no: str | None = Field(None, max_length=50)
    nid_number: str | None = Field(None, max_length=20)

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Slug must be lowercase alphanumeric with hyphens only."""
        if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", v):
            raise ValueError("Slug must be lowercase alphanumeric with hyphens")
        return v


class ShopRead(BaseModel):
    """Public shop representation."""

    shop_id: uuid.UUID
    owner_id: uuid.UUID
    slug: str
    shop_name: str
    description: str | None = None
    logo_url: str | None = None
    banner_url: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    status: ShopStatus
    avg_rating: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}


class ShopUpdate(BaseModel):
    """Partial update for a shop."""

    shop_name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(None, max_length=20)
    logo_url: str | None = None
    banner_url: str | None = None


# --- Shop Config ---


class ShopConfigRead(BaseModel):
    """Shop configuration details."""

    config_id: uuid.UUID
    shop_id: uuid.UUID
    theme_color: str | None = None
    custom_domain: str | None = None
    currency: str
    order_prefix: str
    tax_percentage: Decimal
    tax_inclusive: bool
    return_policy_days: int
    accepting_orders: bool
    delivery_enabled: bool
    delivery_charge_type: DeliveryChargeType
    flat_delivery_fee: Decimal | None = None
    min_order_amount: Decimal | None = None
    auto_accept_orders: bool
    business_hours: dict | None = None
    sms_notifications_enabled: bool
    email_notifications_enabled: bool
    push_notifications_enabled: bool
    meta_title: str | None = None
    meta_description: str | None = None

    model_config = {"from_attributes": True}


class ShopConfigUpdate(BaseModel):
    """Partial update for shop configuration."""

    theme_color: str | None = Field(None, max_length=7)
    custom_domain: str | None = Field(None, max_length=255)
    order_prefix: str | None = Field(None, max_length=10)
    tax_percentage: Decimal | None = Field(None, ge=0, decimal_places=2)
    tax_inclusive: bool | None = None
    return_policy_days: int | None = Field(None, ge=0)
    accepting_orders: bool | None = None
    delivery_enabled: bool | None = None
    delivery_charge_type: DeliveryChargeType | None = None
    flat_delivery_fee: Decimal | None = Field(None, ge=0)
    min_order_amount: Decimal | None = Field(None, ge=0)
    auto_accept_orders: bool | None = None
    business_hours: dict | None = None
    sms_notifications_enabled: bool | None = None
    email_notifications_enabled: bool | None = None
    push_notifications_enabled: bool | None = None
    meta_title: str | None = Field(None, max_length=200)
    meta_description: str | None = None


# --- Shop Address ---


class ShopAddressCreate(BaseModel):
    """Request body for adding a shop address."""

    address_type: ShopAddressType = ShopAddressType.MAIN
    street_address: str = Field(..., min_length=1, max_length=300)
    area: str = Field("Khilgaon", max_length=100)
    city: str = Field("Dhaka", max_length=50)
    postal_code: str = Field(..., max_length=10)
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    contact_phone: str | None = Field(None, max_length=20)
    is_primary: bool = False


class ShopAddressRead(BaseModel):
    """Shop address representation."""

    address_id: uuid.UUID
    shop_id: uuid.UUID
    address_type: ShopAddressType
    street_address: str
    area: str
    city: str
    postal_code: str
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    contact_phone: str | None = None
    is_primary: bool

    model_config = {"from_attributes": True}


class ShopAddressUpdate(BaseModel):
    """Partial update for a shop address."""

    address_type: ShopAddressType | None = None
    street_address: str | None = Field(None, min_length=1, max_length=300)
    area: str | None = Field(None, max_length=100)
    city: str | None = Field(None, max_length=50)
    postal_code: str | None = Field(None, max_length=10)
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    contact_phone: str | None = Field(None, max_length=20)
    is_primary: bool | None = None


# --- Staff ---


class StaffCreate(BaseModel):
    """Request body for adding a staff member."""

    user_id: uuid.UUID
    role: StaffRole = StaffRole.CASHIER
    permissions: dict | None = None


class StaffRead(BaseModel):
    """Staff member representation."""

    staff_id: uuid.UUID
    shop_id: uuid.UUID
    user_id: uuid.UUID
    role: StaffRole
    permissions: dict | None = None
    is_active: bool
    joined_at: datetime

    model_config = {"from_attributes": True}


class StaffUpdate(BaseModel):
    """Partial update for a staff member."""

    role: StaffRole | None = None
    permissions: dict | None = None
    is_active: bool | None = None


# --- Delivery Zone ---


class DeliveryZoneCreate(BaseModel):
    """Request body for creating a delivery zone."""

    zone_name: str = Field(..., min_length=1, max_length=100)
    areas: list = Field(default_factory=list)
    delivery_fee: Decimal = Field(..., ge=0)
    estimated_time_minutes: int | None = None
    sort_order: int = 0
    is_active: bool = True


class DeliveryZoneRead(BaseModel):
    """Delivery zone representation."""

    zone_id: uuid.UUID
    shop_id: uuid.UUID
    zone_name: str
    areas: list
    delivery_fee: Decimal
    estimated_time_minutes: int | None = None
    sort_order: int
    is_active: bool

    model_config = {"from_attributes": True}


class DeliveryZoneUpdate(BaseModel):
    """Partial update for a delivery zone."""

    zone_name: str | None = Field(None, min_length=1, max_length=100)
    areas: list | None = None
    delivery_fee: Decimal | None = Field(None, ge=0)
    estimated_time_minutes: int | None = None
    sort_order: int | None = None
    is_active: bool | None = None


# --- Payment Method ---


class ShopPaymentMethodCreate(BaseModel):
    """Request body for configuring a payment method."""

    method: PaymentMethod
    is_enabled: bool = True
    merchant_id: str | None = Field(None, max_length=100)
    merchant_secret_enc: str | None = Field(None, max_length=500)
    display_account: str | None = Field(None, max_length=50)
    sort_order: int = 0


class ShopPaymentMethodRead(BaseModel):
    """Payment method configuration (secret excluded)."""

    spm_id: uuid.UUID
    shop_id: uuid.UUID
    method: PaymentMethod
    is_enabled: bool
    merchant_id: str | None = None
    display_account: str | None = None
    sort_order: int

    model_config = {"from_attributes": True}


class ShopPaymentMethodUpdate(BaseModel):
    """Partial update for a payment method."""

    is_enabled: bool | None = None
    merchant_id: str | None = Field(None, max_length=100)
    merchant_secret_enc: str | None = Field(None, max_length=500)
    display_account: str | None = Field(None, max_length=50)
    sort_order: int | None = None


# --- Follower ---


class FollowerRead(BaseModel):
    """Shop follower representation."""

    follower_id: uuid.UUID
    shop_id: uuid.UUID
    user_id: uuid.UUID
    notify_new_products: bool
    notify_promotions: bool
    followed_at: datetime

    model_config = {"from_attributes": True}
