"""Payment domain models: Payment, Refund, RefundItem, Payout."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, Uuid, Boolean
from sqlalchemy.dialects.postgresql import ENUM, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import (
    PaymentMethod,
    PaymentStatus,
    PayoutMethod,
    PayoutStatus,
    RefundStatus,
    RefundType,
)


class Payment(Base, TimestampMixin):
    """Maps to payment table."""

    __tablename__ = "payment"

    payment_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("order.order_id", ondelete="RESTRICT"), nullable=False
    )
    method: Mapped[PaymentMethod] = mapped_column(
        ENUM(PaymentMethod, name="payment_method", create_type=False), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    gateway_transaction_id: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[PaymentStatus] = mapped_column(
        ENUM(PaymentStatus, name="payment_status", create_type=False),
        default=PaymentStatus.PENDING,
        nullable=False,
    )
    gateway_response: Mapped[dict | None] = mapped_column(JSONB)
    payer_reference: Mapped[str | None] = mapped_column(String(100))
    ip_address: Mapped[str | None] = mapped_column(String(45))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # --- relationships ---
    order: Mapped["Order"] = relationship("Order", back_populates="payments")  # type: ignore[name-defined]


class Refund(Base, TimestampMixin):
    """Maps to refund table."""

    __tablename__ = "refund"

    refund_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("order.order_id", ondelete="RESTRICT"), nullable=False
    )
    payment_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("payment.payment_id", ondelete="SET NULL")
    )
    requested_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("user.user_id", ondelete="RESTRICT"), nullable=False
    )
    processed_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("user.user_id", ondelete="SET NULL")
    )
    type: Mapped[RefundType] = mapped_column(
        ENUM(RefundType, name="refund_type", create_type=False),
        default=RefundType.REFUND,
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[RefundStatus] = mapped_column(
        ENUM(RefundStatus, name="refund_status", create_type=False),
        default=RefundStatus.REQUESTED,
        nullable=False,
    )
    admin_note: Mapped[str | None] = mapped_column(Text)
    gateway_refund_id: Mapped[str | None] = mapped_column(String(200))
    exchange_order_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("order.order_id", ondelete="SET NULL")
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # --- relationships ---
    order: Mapped["Order"] = relationship(  # type: ignore[name-defined]
        "Order", back_populates="refunds", foreign_keys=[order_id]
    )
    items: Mapped[list["RefundItem"]] = relationship(back_populates="refund")


class RefundItem(Base):
    """Maps to refund_item table."""

    __tablename__ = "refund_item"

    refund_item_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    refund_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("refund.refund_id", ondelete="CASCADE"), nullable=False
    )
    order_item_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("order_item.item_id", ondelete="RESTRICT"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    restocked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # --- relationships ---
    refund: Mapped["Refund"] = relationship(back_populates="items")


class Payout(Base, TimestampMixin):
    """Maps to payout table."""

    __tablename__ = "payout"

    payout_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    shop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("shop.shop_id", ondelete="RESTRICT"), nullable=False
    )
    period_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    period_end: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    order_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    gross_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    commission_rate: Mapped[Decimal] = mapped_column(
        Numeric(5, 4), default=Decimal("0"), nullable=False
    )
    commission_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0"), nullable=False
    )
    refund_deductions: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0"), nullable=False
    )
    net_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[PayoutStatus] = mapped_column(
        ENUM(PayoutStatus, name="payout_status", create_type=False),
        default=PayoutStatus.PENDING,
        nullable=False,
    )
    transaction_reference: Mapped[str | None] = mapped_column(String(200))
    payout_method: Mapped[PayoutMethod] = mapped_column(
        ENUM(PayoutMethod, name="payout_method", create_type=False), nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
