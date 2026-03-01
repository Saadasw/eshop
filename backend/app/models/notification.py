"""Notification domain model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import NotificationChannel, NotificationType


class Notification(Base):
    """Maps to notification table."""

    __tablename__ = "notification"

    notification_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False
    )
    shop_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("shop.shop_id", ondelete="CASCADE")
    )
    reference_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    reference_type: Mapped[str | None] = mapped_column(String(50))
    type: Mapped[NotificationType] = mapped_column(
        ENUM(NotificationType, name="notification_type", create_type=False),
        nullable=False,
    )
    channel: Mapped[NotificationChannel] = mapped_column(
        ENUM(NotificationChannel, name="notification_channel", create_type=False),
        default=NotificationChannel.IN_APP,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    action_url: Mapped[str | None] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
