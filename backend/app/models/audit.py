"""Audit & operations models: AuditLog, BulkJob, PlatformSetting."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.dialects.postgresql import ENUM, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin
from app.models.enums import AuditAction, BulkJobStatus, BulkJobType


class AuditLog(Base):
    """Maps to audit_log table."""

    __tablename__ = "audit_log"

    log_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("user.user_id", ondelete="SET NULL")
    )
    shop_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("shop.shop_id", ondelete="SET NULL")
    )
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    action: Mapped[AuditAction] = mapped_column(
        ENUM(AuditAction, name="audit_action", create_type=False), nullable=False
    )
    old_values: Mapped[dict | None] = mapped_column(JSONB)
    new_values: Mapped[dict | None] = mapped_column(JSONB)
    ip_address: Mapped[str | None] = mapped_column(String(45))
    user_agent: Mapped[str | None] = mapped_column(Text)
    request_id: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class BulkJob(Base, TimestampMixin):
    """Maps to bulk_job table."""

    __tablename__ = "bulk_job"

    job_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    shop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("shop.shop_id", ondelete="CASCADE"), nullable=False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("user.user_id", ondelete="RESTRICT"), nullable=False
    )
    type: Mapped[BulkJobType] = mapped_column(
        ENUM(BulkJobType, name="bulk_job_type", create_type=False), nullable=False
    )
    status: Mapped[BulkJobStatus] = mapped_column(
        ENUM(BulkJobStatus, name="bulk_job_status", create_type=False),
        default=BulkJobStatus.PENDING,
        nullable=False,
    )
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    result_file_url: Mapped[str | None] = mapped_column(Text)
    total_rows: Mapped[int | None] = mapped_column(Integer)
    success_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_details: Mapped[dict | None] = mapped_column(JSONB)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class PlatformSetting(Base, TimestampMixin):
    """Maps to platform_setting table."""

    __tablename__ = "platform_setting"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[dict] = mapped_column(JSONB, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("user.user_id", ondelete="SET NULL")
    )
