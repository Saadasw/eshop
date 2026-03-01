"""Archive models: OrderArchive, PaymentArchive, AuditLogArchive."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Uuid
from sqlalchemy.dialects.postgresql import ENUM, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import AuditAction, PaymentMethod


class OrderArchive(Base):
    """Maps to order_archive table (read-only archive)."""

    __tablename__ = "order_archive"

    order_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    order_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    order_items: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status_history: Mapped[dict] = mapped_column(JSONB, nullable=False)
    payments: Mapped[dict] = mapped_column(JSONB, nullable=False)
    refunds: Mapped[dict | None] = mapped_column(JSONB)
    shop_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    customer_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    order_number: Mapped[str] = mapped_column(String(20), nullable=False)
    ordered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    archived_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    archive_reason: Mapped[str] = mapped_column(
        String(50), default="age_policy", nullable=False
    )


class PaymentArchive(Base):
    """Maps to payment_archive table (read-only archive)."""

    __tablename__ = "payment_archive"

    payment_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    payment_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    order_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    shop_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    method: Mapped[PaymentMethod] = mapped_column(
        ENUM(PaymentMethod, name="payment_method", create_type=False), nullable=False
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    archived_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    archive_reason: Mapped[str] = mapped_column(
        String(50), default="age_policy", nullable=False
    )


class AuditLogArchive(Base):
    """Maps to audit_log_archive table (read-only archive)."""

    __tablename__ = "audit_log_archive"

    log_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    log_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    action: Mapped[AuditAction] = mapped_column(
        ENUM(AuditAction, name="audit_action", create_type=False), nullable=False
    )
    partition_key: Mapped[str] = mapped_column(String(7), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    archived_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
