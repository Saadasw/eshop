"""Pydantic schemas for product domain operations."""

import re
import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.models.enums import MediaType, ProductType


# --- Category ---


class CategoryCreate(BaseModel):
    """Request body for creating a category."""

    name: str = Field(..., min_length=1, max_length=120)
    slug: str = Field(..., min_length=1, max_length=150)
    parent_id: uuid.UUID | None = None
    icon_url: str | None = None
    sort_order: int = 0
    is_active: bool = True

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Slug must be lowercase alphanumeric with hyphens only."""
        if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", v):
            raise ValueError("Slug must be lowercase alphanumeric with hyphens")
        return v


class CategoryRead(BaseModel):
    """Category representation."""

    category_id: uuid.UUID
    shop_id: uuid.UUID
    parent_id: uuid.UUID | None = None
    name: str
    slug: str
    icon_url: str | None = None
    sort_order: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class CategoryUpdate(BaseModel):
    """Partial update for a category."""

    name: str | None = Field(None, min_length=1, max_length=120)
    slug: str | None = Field(None, min_length=1, max_length=150)
    parent_id: uuid.UUID | None = None
    icon_url: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str | None) -> str | None:
        """Slug must be lowercase alphanumeric with hyphens only."""
        if v is not None and not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", v):
            raise ValueError("Slug must be lowercase alphanumeric with hyphens")
        return v


# --- Product Attribute ---


class AttributeOptionCreate(BaseModel):
    """Request body for creating an attribute option."""

    value: str = Field(..., min_length=1, max_length=100)
    color_hex: str | None = Field(None, max_length=7)
    sort_order: int = 0


class AttributeOptionRead(BaseModel):
    """Attribute option representation."""

    option_id: uuid.UUID
    attribute_id: uuid.UUID
    value: str
    color_hex: str | None = None
    sort_order: int

    model_config = {"from_attributes": True}


class AttributeCreate(BaseModel):
    """Request body for creating a product attribute."""

    name: str = Field(..., min_length=1, max_length=100)
    sort_order: int = 0
    options: list[AttributeOptionCreate] = Field(default_factory=list)


class AttributeRead(BaseModel):
    """Product attribute representation with options."""

    attribute_id: uuid.UUID
    shop_id: uuid.UUID
    name: str
    sort_order: int
    options: list[AttributeOptionRead] = []

    model_config = {"from_attributes": True}


# --- Variant ---


class VariantAttributeOptionInput(BaseModel):
    """Attribute-option pair for linking a variant to attribute values."""

    attribute_id: uuid.UUID
    option_id: uuid.UUID


class VariantCreate(BaseModel):
    """Request body for creating a product variant."""

    sku: str = Field(..., min_length=1, max_length=50)
    variant_name: str | None = Field(None, max_length=200)
    price: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)
    compare_at_price: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=2)
    stock_quantity: int = Field(0, ge=0)
    low_stock_threshold: int = 5
    track_inventory: bool = True
    weight_grams: int | None = None
    is_default: bool = False
    attribute_options: list[VariantAttributeOptionInput] = Field(default_factory=list)


class VariantRead(BaseModel):
    """Product variant representation."""

    variant_id: uuid.UUID
    product_id: uuid.UUID
    sku: str
    variant_name: str | None = None
    price: Decimal
    compare_at_price: Decimal | None = None
    stock_quantity: int
    low_stock_threshold: int
    track_inventory: bool
    weight_grams: int | None = None
    is_default: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class VariantUpdate(BaseModel):
    """Partial update for a product variant."""

    sku: str | None = Field(None, min_length=1, max_length=50)
    variant_name: str | None = Field(None, max_length=200)
    price: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=2)
    compare_at_price: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=2)
    stock_quantity: int | None = Field(None, ge=0)
    low_stock_threshold: int | None = None
    track_inventory: bool | None = None
    weight_grams: int | None = None
    is_active: bool | None = None


# --- Product Media ---


class ProductMediaRead(BaseModel):
    """Product media representation."""

    media_id: uuid.UUID
    product_id: uuid.UUID
    file_url: str
    media_type: MediaType
    alt_text: str | None = None
    file_size_bytes: int | None = None
    sort_order: int
    is_primary: bool
    uploaded_at: datetime

    model_config = {"from_attributes": True}


# --- Product ---


class ProductCreate(BaseModel):
    """Request body for creating a product."""

    sku: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=250)
    description: str | None = None
    base_price: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)
    compare_at_price: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=2)
    category_id: uuid.UUID | None = None
    product_type: ProductType = ProductType.PHYSICAL
    brand: str | None = Field(None, max_length=100)
    weight_grams: int | None = None
    is_active: bool = True
    is_featured: bool = False
    tags: list[str] = Field(default_factory=list)
    variants: list[VariantCreate] = Field(default_factory=list)


class ProductRead(BaseModel):
    """Full product representation with nested relations."""

    product_id: uuid.UUID
    shop_id: uuid.UUID
    category_id: uuid.UUID | None = None
    sku: str
    name: str
    description: str | None = None
    base_price: Decimal
    compare_at_price: Decimal | None = None
    min_price: Decimal | None = None
    max_price: Decimal | None = None
    product_type: ProductType
    brand: str | None = None
    weight_grams: int | None = None
    is_active: bool
    is_featured: bool
    is_new: bool
    total_sales: int
    avg_rating: Decimal
    review_count: int
    created_at: datetime
    variants: list[VariantRead] = []
    media: list[ProductMediaRead] = []
    tags: list[str] = []

    model_config = {"from_attributes": True}

    @field_validator("tags", mode="before")
    @classmethod
    def extract_tag_names(cls, v: list) -> list[str]:
        """Convert ProductTag objects to plain strings."""
        if v and hasattr(v[0], "tag_name"):
            return [tag.tag_name for tag in v]
        return v


class ProductUpdate(BaseModel):
    """Partial update for a product."""

    name: str | None = Field(None, min_length=1, max_length=250)
    description: str | None = None
    base_price: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=2)
    compare_at_price: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=2)
    category_id: uuid.UUID | None = None
    product_type: ProductType | None = None
    brand: str | None = Field(None, max_length=100)
    weight_grams: int | None = None
    is_active: bool | None = None
    is_featured: bool | None = None
    is_new: bool | None = None
    tags: list[str] | None = None
