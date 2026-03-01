"""Pydantic schemas for cart operations."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class CartItemAdd(BaseModel):
    """Request body for adding an item to the cart."""

    variant_id: uuid.UUID
    quantity: int = Field(..., gt=0)


class CartItemUpdate(BaseModel):
    """Request body for updating cart item quantity."""

    quantity: int = Field(..., gt=0)


class CartItemRead(BaseModel):
    """Cart item representation with variant details."""

    cart_item_id: uuid.UUID
    variant_id: uuid.UUID
    quantity: int
    # Denormalized from variant for display
    variant_name: str | None = None
    product_name: str | None = None
    sku: str | None = None
    unit_price: Decimal | None = None
    image_url: str | None = None
    stock_quantity: int | None = None

    model_config = {"from_attributes": True}


class CartRead(BaseModel):
    """Full cart representation."""

    cart_id: uuid.UUID
    shop_id: uuid.UUID
    user_id: uuid.UUID | None = None
    items: list[CartItemRead] = []
    item_count: int = 0
    subtotal: Decimal = Decimal("0")

    model_config = {"from_attributes": True}
