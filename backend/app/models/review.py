"""Review domain model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, SmallInteger, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin


class Review(Base, TimestampMixin, SoftDeleteMixin):
    """Maps to review table."""

    __tablename__ = "review"

    review_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("product.product_id", ondelete="CASCADE"), nullable=False
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("user.user_id", ondelete="RESTRICT"), nullable=False
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("order.order_id", ondelete="RESTRICT"), nullable=False
    )
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text)
    shop_reply: Mapped[str | None] = mapped_column(Text)
    replied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_refunded_order: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # --- relationships ---
    product: Mapped["Product"] = relationship("Product", back_populates="reviews")  # type: ignore[name-defined]
    customer: Mapped["User"] = relationship("User")  # type: ignore[name-defined]
