"""Order domain models: Order, OrderItem, OrderStatusHistory."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, Uuid
from sqlalchemy.dialects.postgresql import ENUM, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin
from app.models.enums import (
    FulfillmentType,
    OrderEventType,
    OrderItemStatus,
    OrderPaymentStatus,
    OrderStatus,
)


class Order(Base, SoftDeleteMixin):
    """Maps to 'order' table (quoted — reserved word in PG)."""

    __tablename__ = "order"

    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    order_number: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False
    )
    shop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("shop.shop_id", ondelete="RESTRICT"), nullable=False
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("user.user_id", ondelete="RESTRICT"), nullable=False
    )
    coupon_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("coupon.coupon_id", ondelete="SET NULL")
    )
    coupon_code_snapshot: Mapped[str | None] = mapped_column(String(50))
    delivery_address_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("customer_address.address_id", ondelete="SET NULL")
    )
    delivery_address_snapshot: Mapped[dict | None] = mapped_column(JSONB)
    delivery_zone_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("delivery_zone.zone_id", ondelete="SET NULL")
    )
    delivery_zone_name_snapshot: Mapped[str | None] = mapped_column(String(100))
    assigned_staff_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("shop_staff.staff_id", ondelete="SET NULL")
    )
    status: Mapped[OrderStatus] = mapped_column(
        ENUM(OrderStatus, name="order_status", create_type=False),
        default=OrderStatus.PENDING,
        nullable=False,
    )
    payment_status: Mapped[OrderPaymentStatus] = mapped_column(
        ENUM(OrderPaymentStatus, name="order_payment_status", create_type=False),
        default=OrderPaymentStatus.UNPAID,
        nullable=False,
    )
    fulfillment_type: Mapped[FulfillmentType] = mapped_column(
        ENUM(FulfillmentType, name="fulfillment_type", create_type=False),
        default=FulfillmentType.DELIVERY,
        nullable=False,
    )
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    delivery_fee: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("0"), nullable=False
    )
    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("0"), nullable=False
    )
    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("0"), nullable=False
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    customer_note: Mapped[str | None] = mapped_column(Text)
    shop_note: Mapped[str | None] = mapped_column(Text)
    tracking_number: Mapped[str | None] = mapped_column(String(100))
    delivery_partner: Mapped[str | None] = mapped_column(String(100))
    cancelled_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("user.user_id", ondelete="SET NULL")
    )
    cancel_reason: Mapped[str | None] = mapped_column(String(500))
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    processing_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ready_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    shipped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ordered_at: Mapped[datetime] = mapped_column(
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
    shop: Mapped["Shop"] = relationship("Shop", back_populates="orders")  # type: ignore[name-defined]
    customer: Mapped["User"] = relationship("User", foreign_keys=[customer_id])  # type: ignore[name-defined]
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")
    status_history: Mapped[list["OrderStatusHistory"]] = relationship(
        back_populates="order"
    )
    payments: Mapped[list["Payment"]] = relationship(  # type: ignore[name-defined]
        "Payment", back_populates="order"
    )
    refunds: Mapped[list["Refund"]] = relationship(  # type: ignore[name-defined]
        "Refund",
        back_populates="order",
        foreign_keys="Refund.order_id",
    )


class OrderItem(Base):
    """Maps to order_item table."""

    __tablename__ = "order_item"

    item_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("order.order_id", ondelete="CASCADE"), nullable=False
    )
    variant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("product_variant.variant_id", ondelete="RESTRICT"),
        nullable=False,
    )
    product_name_snapshot: Mapped[str] = mapped_column(String(250), nullable=False)
    variant_name_snapshot: Mapped[str | None] = mapped_column(String(200))
    sku_snapshot: Mapped[str] = mapped_column(String(50), nullable=False)
    image_url_snapshot: Mapped[str | None] = mapped_column(Text)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price_snapshot: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("0"), nullable=False
    )
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[OrderItemStatus] = mapped_column(
        ENUM(OrderItemStatus, name="order_item_status", create_type=False),
        default=OrderItemStatus.PENDING,
        nullable=False,
    )

    # --- relationships ---
    order: Mapped["Order"] = relationship(back_populates="items")
    variant: Mapped["ProductVariant"] = relationship("ProductVariant")  # type: ignore[name-defined]


class OrderStatusHistory(Base):
    """Maps to order_status_history table."""

    __tablename__ = "order_status_history"

    history_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("order.order_id", ondelete="CASCADE"), nullable=False
    )
    from_status: Mapped[OrderStatus | None] = mapped_column(
        ENUM(OrderStatus, name="order_status", create_type=False)
    )
    to_status: Mapped[OrderStatus] = mapped_column(
        ENUM(OrderStatus, name="order_status", create_type=False), nullable=False
    )
    event_type: Mapped[OrderEventType] = mapped_column(
        ENUM(OrderEventType, name="order_event_type", create_type=False),
        default=OrderEventType.STATUS_CHANGE,
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(String(500))
    changed_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("user.user_id", ondelete="RESTRICT"), nullable=False
    )
    ip_address: Mapped[str | None] = mapped_column(String(45))
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # --- relationships ---
    order: Mapped["Order"] = relationship(back_populates="status_history")
