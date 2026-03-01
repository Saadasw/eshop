"""Shop domain models: Shop, ShopConfig, ShopAddress, ShopStaff, ShopPaymentMethod, DeliveryZone, ShopFollower."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Uuid,
)
from sqlalchemy.dialects.postgresql import ENUM, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin
from app.models.enums import (
    DeliveryChargeType,
    PaymentMethod,
    ShopAddressType,
    ShopStatus,
    StaffRole,
)


class Shop(Base, TimestampMixin, SoftDeleteMixin):
    """Maps to shop table."""

    __tablename__ = "shop"

    shop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("user.user_id", ondelete="RESTRICT"), nullable=False
    )
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    shop_name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    logo_url: Mapped[str | None] = mapped_column(Text)
    banner_url: Mapped[str | None] = mapped_column(Text)
    contact_email: Mapped[str | None] = mapped_column(String(255))
    contact_phone: Mapped[str | None] = mapped_column(String(20))
    trade_license_no: Mapped[str | None] = mapped_column(String(50))
    nid_number: Mapped[str | None] = mapped_column(String(20))
    status: Mapped[ShopStatus] = mapped_column(
        ENUM(ShopStatus, name="shop_status", create_type=False),
        default=ShopStatus.PENDING,
        nullable=False,
    )
    avg_rating: Mapped[Decimal] = mapped_column(
        Numeric(3, 2), default=Decimal("0"), nullable=False
    )
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("user.user_id", ondelete="SET NULL")
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejection_reason: Mapped[str | None] = mapped_column(String(500))
    closed_reason: Mapped[str | None] = mapped_column(String(500))

    # --- relationships ---
    owner: Mapped["User"] = relationship(  # type: ignore[name-defined]
        "User", back_populates="shops", foreign_keys=[owner_id]
    )
    config: Mapped["ShopConfig | None"] = relationship(
        back_populates="shop", uselist=False
    )
    addresses: Mapped[list["ShopAddress"]] = relationship(back_populates="shop")
    staff: Mapped[list["ShopStaff"]] = relationship(back_populates="shop")
    payment_methods: Mapped[list["ShopPaymentMethod"]] = relationship(
        back_populates="shop"
    )
    delivery_zones: Mapped[list["DeliveryZone"]] = relationship(back_populates="shop")
    followers: Mapped[list["ShopFollower"]] = relationship(back_populates="shop")
    products: Mapped[list["Product"]] = relationship(  # type: ignore[name-defined]
        "Product", back_populates="shop"
    )
    categories: Mapped[list["Category"]] = relationship(  # type: ignore[name-defined]
        "Category", back_populates="shop"
    )
    orders: Mapped[list["Order"]] = relationship(  # type: ignore[name-defined]
        "Order", back_populates="shop"
    )


class ShopConfig(Base, TimestampMixin):
    """Maps to shop_config table (1:1 with shop)."""

    __tablename__ = "shop_config"

    config_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    shop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("shop.shop_id", ondelete="CASCADE"), unique=True, nullable=False
    )
    theme_color: Mapped[str | None] = mapped_column(String(7))
    custom_domain: Mapped[str | None] = mapped_column(String(255))
    currency: Mapped[str] = mapped_column(String(3), default="BDT", nullable=False)
    order_prefix: Mapped[str] = mapped_column(
        String(10), default="KHG", nullable=False
    )
    tax_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("0"), nullable=False
    )
    tax_inclusive: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    return_policy_days: Mapped[int] = mapped_column(
        Integer, default=7, nullable=False
    )
    accepting_orders: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    delivery_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    delivery_charge_type: Mapped[DeliveryChargeType] = mapped_column(
        ENUM(DeliveryChargeType, name="delivery_charge_type", create_type=False),
        default=DeliveryChargeType.FLAT,
        nullable=False,
    )
    flat_delivery_fee: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    min_order_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    auto_accept_orders: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    business_hours: Mapped[dict | None] = mapped_column(JSONB)
    sms_notifications_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    email_notifications_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    push_notifications_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    meta_title: Mapped[str | None] = mapped_column(String(200))
    meta_description: Mapped[str | None] = mapped_column(Text)

    # --- relationships ---
    shop: Mapped["Shop"] = relationship(back_populates="config")


class ShopAddress(Base, TimestampMixin):
    """Maps to shop_address table."""

    __tablename__ = "shop_address"

    address_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    shop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("shop.shop_id", ondelete="CASCADE"), nullable=False
    )
    address_type: Mapped[ShopAddressType] = mapped_column(
        ENUM(ShopAddressType, name="shop_address_type", create_type=False),
        default=ShopAddressType.MAIN,
        nullable=False,
    )
    street_address: Mapped[str] = mapped_column(String(300), nullable=False)
    area: Mapped[str] = mapped_column(String(100), default="Khilgaon", nullable=False)
    city: Mapped[str] = mapped_column(String(50), default="Dhaka", nullable=False)
    postal_code: Mapped[str] = mapped_column(String(10), nullable=False)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 8))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(11, 8))
    contact_phone: Mapped[str | None] = mapped_column(String(20))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # --- relationships ---
    shop: Mapped["Shop"] = relationship(back_populates="addresses")


class ShopStaff(Base, SoftDeleteMixin):
    """Maps to shop_staff table."""

    __tablename__ = "shop_staff"

    staff_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    shop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("shop.shop_id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[StaffRole] = mapped_column(
        ENUM(StaffRole, name="staff_role", create_type=False),
        default=StaffRole.CASHIER,
        nullable=False,
    )
    permissions: Mapped[dict | None] = mapped_column(JSONB)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # --- relationships ---
    shop: Mapped["Shop"] = relationship(back_populates="staff")
    user: Mapped["User"] = relationship("User")  # type: ignore[name-defined]


class ShopPaymentMethod(Base, TimestampMixin):
    """Maps to shop_payment_method table."""

    __tablename__ = "shop_payment_method"

    spm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    shop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("shop.shop_id", ondelete="CASCADE"), nullable=False
    )
    method: Mapped[PaymentMethod] = mapped_column(
        ENUM(PaymentMethod, name="payment_method", create_type=False), nullable=False
    )
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    merchant_id: Mapped[str | None] = mapped_column(String(100))
    merchant_secret_enc: Mapped[str | None] = mapped_column(String(500))
    display_account: Mapped[str | None] = mapped_column(String(50))
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # --- relationships ---
    shop: Mapped["Shop"] = relationship(back_populates="payment_methods")


class DeliveryZone(Base, TimestampMixin):
    """Maps to delivery_zone table."""

    __tablename__ = "delivery_zone"

    zone_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    shop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("shop.shop_id", ondelete="CASCADE"), nullable=False
    )
    zone_name: Mapped[str] = mapped_column(String(100), nullable=False)
    areas: Mapped[dict] = mapped_column(JSONB, default=list, nullable=False)
    delivery_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    estimated_time_minutes: Mapped[int | None] = mapped_column(Integer)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # --- relationships ---
    shop: Mapped["Shop"] = relationship(back_populates="delivery_zones")


class ShopFollower(Base):
    """Maps to shop_follower table."""

    __tablename__ = "shop_follower"

    follower_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    shop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("shop.shop_id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False
    )
    notify_new_products: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    notify_promotions: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    followed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # --- relationships ---
    shop: Mapped["Shop"] = relationship(back_populates="followers")
    user: Mapped["User"] = relationship("User")  # type: ignore[name-defined]
