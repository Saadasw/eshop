"""Pydantic schemas for customer address operations."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class CustomerAddressCreate(BaseModel):
    """Request body for creating a customer address."""

    label: str | None = Field(None, max_length=50)
    recipient_name: str = Field(..., min_length=1, max_length=120)
    phone: str = Field(..., min_length=11, max_length=20)
    street_address: str = Field(..., min_length=1, max_length=300)
    area: str = Field(..., min_length=1, max_length=100)
    city: str = Field("Dhaka", max_length=50)
    postal_code: str = Field(..., min_length=1, max_length=10)
    latitude: Decimal | None = Field(None, max_digits=10, decimal_places=8)
    longitude: Decimal | None = Field(None, max_digits=11, decimal_places=8)
    is_default: bool = False

    @field_validator("phone")
    @classmethod
    def validate_bd_phone(cls, v: str) -> str:
        """Validate Bangladeshi phone number format."""
        import re

        if not re.match(r"^01[3-9]\d{8}$", v):
            raise ValueError("Invalid BD phone number. Must match 01XXXXXXXXX")
        return v


class CustomerAddressUpdate(BaseModel):
    """Request body for updating a customer address."""

    label: str | None = None
    recipient_name: str | None = Field(None, min_length=1, max_length=120)
    phone: str | None = Field(None, min_length=11, max_length=20)
    street_address: str | None = Field(None, min_length=1, max_length=300)
    area: str | None = Field(None, min_length=1, max_length=100)
    city: str | None = Field(None, max_length=50)
    postal_code: str | None = Field(None, min_length=1, max_length=10)
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    is_default: bool | None = None

    @field_validator("phone")
    @classmethod
    def validate_bd_phone(cls, v: str | None) -> str | None:
        """Validate Bangladeshi phone number format if provided."""
        if v is None:
            return v
        import re

        if not re.match(r"^01[3-9]\d{8}$", v):
            raise ValueError("Invalid BD phone number. Must match 01XXXXXXXXX")
        return v


class CustomerAddressRead(BaseModel):
    """Customer address representation returned to clients."""

    address_id: uuid.UUID
    user_id: uuid.UUID
    label: str | None = None
    recipient_name: str
    phone: str
    street_address: str
    area: str
    city: str
    postal_code: str
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
