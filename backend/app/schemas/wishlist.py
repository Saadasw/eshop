"""Pydantic schemas for wishlist operations."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class WishlistItemAdd(BaseModel):
    """Request body for adding a product to the wishlist."""

    product_id: uuid.UUID
    shop_id: uuid.UUID


class WishlistItemRead(BaseModel):
    """Wishlist item with denormalized product info."""

    wishlist_id: uuid.UUID
    user_id: uuid.UUID
    product_id: uuid.UUID
    shop_id: uuid.UUID
    added_at: datetime

    # Denormalized product info
    product_name: str | None = None
    product_slug: str | None = None
    product_image: str | None = None
    min_price: Decimal | None = None
    max_price: Decimal | None = None
    is_active: bool = True

    model_config = {"from_attributes": True}
