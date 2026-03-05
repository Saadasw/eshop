"""Pydantic schemas for notification operations."""

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import NotificationChannel, NotificationType


class NotificationRead(BaseModel):
    """Notification representation returned to clients."""

    notification_id: uuid.UUID
    user_id: uuid.UUID
    shop_id: uuid.UUID | None = None
    reference_id: uuid.UUID | None = None
    reference_type: str | None = None
    type: NotificationType
    channel: NotificationChannel
    title: str
    message: str
    action_url: str | None = None
    is_read: bool
    read_at: datetime | None = None
    created_at: datetime
    expires_at: datetime | None = None

    model_config = {"from_attributes": True}


class NotificationMarkRead(BaseModel):
    """Request body for marking a notification as read."""

    is_read: bool = True


class UnreadCountResponse(BaseModel):
    """Response for unread notification count."""

    count: int
