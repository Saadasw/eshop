"""Coupon domain models: Coupon, CouponUsage."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Uuid
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin
from app.models.enums import CouponScope, DiscountType


class Coupon(Base, TimestampMixin, SoftDeleteMixin):
    """Maps to coupon table."""

    __tablename__ = "coupon"

    coupon_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    shop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("shop.shop_id", ondelete="CASCADE"), nullable=False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("user.user_id", ondelete="RESTRICT"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    discount_type: Mapped[DiscountType] = mapped_column(
        ENUM(DiscountType, name="discount_type", create_type=False), nullable=False
    )
    discount_value: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    min_order_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    max_discount_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    max_usage: Mapped[int | None] = mapped_column(Integer)
    max_usage_per_user: Mapped[int] = mapped_column(
        Integer, default=1, nullable=False
    )
    times_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    applies_to: Mapped[CouponScope] = mapped_column(
        ENUM(CouponScope, name="coupon_scope", create_type=False),
        default=CouponScope.ALL,
        nullable=False,
    )
    target_category_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("category.category_id", ondelete="SET NULL")
    )
    target_product_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("product.product_id", ondelete="SET NULL")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    valid_from: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    valid_until: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    # --- relationships ---
    usages: Mapped[list["CouponUsage"]] = relationship(back_populates="coupon")


class CouponUsage(Base):
    """Maps to coupon_usage table."""

    __tablename__ = "coupon_usage"

    usage_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    coupon_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("coupon.coupon_id", ondelete="RESTRICT"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("user.user_id", ondelete="RESTRICT"), nullable=False
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("order.order_id", ondelete="RESTRICT"), nullable=False
    )
    discount_applied: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    used_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # --- relationships ---
    coupon: Mapped["Coupon"] = relationship(back_populates="usages")
