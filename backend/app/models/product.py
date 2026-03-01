"""Product domain models: Category, Product, ProductAttribute, AttributeOption, ProductVariant, VariantAttributeOption, ProductMedia, VariantMedia, ProductTag."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    Uuid,
)
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin
from app.models.enums import MediaType, ProductType


class Category(Base, TimestampMixin, SoftDeleteMixin):
    """Maps to category table."""

    __tablename__ = "category"

    category_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    shop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("shop.shop_id", ondelete="CASCADE"), nullable=False
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("category.category_id", ondelete="SET NULL")
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(150), nullable=False)
    icon_url: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # --- relationships ---
    shop: Mapped["Shop"] = relationship("Shop", back_populates="categories")  # type: ignore[name-defined]
    parent: Mapped["Category | None"] = relationship(
        remote_side=[category_id], back_populates="children"
    )
    children: Mapped[list["Category"]] = relationship(back_populates="parent")
    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(Base, TimestampMixin, SoftDeleteMixin):
    """Maps to product table."""

    __tablename__ = "product"

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    shop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("shop.shop_id", ondelete="CASCADE"), nullable=False
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("category.category_id", ondelete="SET NULL")
    )
    sku: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(250), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    base_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    compare_at_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    min_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    max_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    product_type: Mapped[ProductType] = mapped_column(
        ENUM(ProductType, name="product_type", create_type=False),
        default=ProductType.PHYSICAL,
        nullable=False,
    )
    brand: Mapped[str | None] = mapped_column(String(100))
    weight_grams: Mapped[int | None] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_new: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    total_sales: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    avg_rating: Mapped[Decimal] = mapped_column(
        Numeric(3, 2), default=Decimal("0"), nullable=False
    )
    review_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # --- relationships ---
    shop: Mapped["Shop"] = relationship("Shop", back_populates="products")  # type: ignore[name-defined]
    category: Mapped["Category | None"] = relationship(back_populates="products")
    variants: Mapped[list["ProductVariant"]] = relationship(back_populates="product")
    media: Mapped[list["ProductMedia"]] = relationship(back_populates="product")
    tags: Mapped[list["ProductTag"]] = relationship(back_populates="product")
    reviews: Mapped[list["Review"]] = relationship(  # type: ignore[name-defined]
        "Review", back_populates="product"
    )


class ProductAttribute(Base, TimestampMixin):
    """Maps to product_attribute table."""

    __tablename__ = "product_attribute"

    attribute_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    shop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("shop.shop_id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # --- relationships ---
    options: Mapped[list["AttributeOption"]] = relationship(back_populates="attribute")


class AttributeOption(Base):
    """Maps to attribute_option table."""

    __tablename__ = "attribute_option"

    option_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    attribute_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("product_attribute.attribute_id", ondelete="CASCADE"),
        nullable=False,
    )
    value: Mapped[str] = mapped_column(String(100), nullable=False)
    color_hex: Mapped[str | None] = mapped_column(String(7))
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # --- relationships ---
    attribute: Mapped["ProductAttribute"] = relationship(back_populates="options")


class ProductVariant(Base, TimestampMixin, SoftDeleteMixin):
    """Maps to product_variant table."""

    __tablename__ = "product_variant"

    variant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("product.product_id", ondelete="CASCADE"), nullable=False
    )
    sku: Mapped[str] = mapped_column(String(50), nullable=False)
    variant_name: Mapped[str | None] = mapped_column(String(200))
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    compare_at_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    low_stock_threshold: Mapped[int] = mapped_column(
        Integer, default=5, nullable=False
    )
    track_inventory: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    weight_grams: Mapped[int | None] = mapped_column(Integer)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # --- relationships ---
    product: Mapped["Product"] = relationship(back_populates="variants")
    attribute_options: Mapped[list["VariantAttributeOption"]] = relationship(
        back_populates="variant"
    )
    variant_media: Mapped[list["VariantMedia"]] = relationship(
        back_populates="variant"
    )


class VariantAttributeOption(Base):
    """Maps to variant_attribute_option (junction) table."""

    __tablename__ = "variant_attribute_option"

    vao_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    variant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("product_variant.variant_id", ondelete="CASCADE"),
        nullable=False,
    )
    option_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("attribute_option.option_id", ondelete="CASCADE"),
        nullable=False,
    )
    attribute_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("product_attribute.attribute_id", ondelete="CASCADE"),
        nullable=False,
    )

    # --- relationships ---
    variant: Mapped["ProductVariant"] = relationship(
        back_populates="attribute_options"
    )
    option: Mapped["AttributeOption"] = relationship()
    attribute: Mapped["ProductAttribute"] = relationship()


class ProductMedia(Base):
    """Maps to product_media table."""

    __tablename__ = "product_media"

    media_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("product.product_id", ondelete="CASCADE"), nullable=False
    )
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    media_type: Mapped[MediaType] = mapped_column(
        ENUM(MediaType, name="media_type", create_type=False),
        default=MediaType.IMAGE,
        nullable=False,
    )
    alt_text: Mapped[str | None] = mapped_column(String(300))
    file_size_bytes: Mapped[int | None] = mapped_column(Integer)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # --- relationships ---
    product: Mapped["Product"] = relationship(back_populates="media")


class VariantMedia(Base):
    """Maps to variant_media table."""

    __tablename__ = "variant_media"

    vmedia_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    variant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("product_variant.variant_id", ondelete="CASCADE"),
        nullable=False,
    )
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    media_type: Mapped[MediaType] = mapped_column(
        ENUM(MediaType, name="media_type", create_type=False),
        default=MediaType.IMAGE,
        nullable=False,
    )
    alt_text: Mapped[str | None] = mapped_column(String(300))
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # --- relationships ---
    variant: Mapped["ProductVariant"] = relationship(back_populates="variant_media")


class ProductTag(Base):
    """Maps to product_tag table."""

    __tablename__ = "product_tag"

    tag_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("product.product_id", ondelete="CASCADE"), nullable=False
    )
    tag_name: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # --- relationships ---
    product: Mapped["Product"] = relationship(back_populates="tags")
