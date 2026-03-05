"""Notification service — create, list, mark read."""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import NotificationChannel, NotificationType
from app.models.notification import Notification


async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    type: NotificationType,
    title: str,
    message: str,
    shop_id: uuid.UUID | None = None,
    reference_id: uuid.UUID | None = None,
    reference_type: str | None = None,
    action_url: str | None = None,
    channel: NotificationChannel = NotificationChannel.IN_APP,
) -> Notification:
    """Create a notification for a user. Internal helper called by other services.

    Args:
        db: Async database session.
        user_id: UUID of the recipient user.
        type: Notification type (order_placed, low_stock, etc.).
        title: Short notification title.
        message: Notification body text.
        shop_id: Optional shop context.
        reference_id: Optional reference to related entity (order, refund, etc.).
        reference_type: Type of the referenced entity (e.g., "order", "refund").
        action_url: Optional URL for the notification action.
        channel: Delivery channel (defaults to IN_APP).

    Returns:
        Created Notification.
    """
    notification = Notification(
        user_id=user_id,
        shop_id=shop_id,
        type=type,
        channel=channel,
        title=title,
        message=message,
        reference_id=reference_id,
        reference_type=reference_type,
        action_url=action_url,
    )
    db.add(notification)
    return notification


async def list_notifications(
    db: AsyncSession,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 20,
    unread_only: bool = False,
) -> tuple[list[Notification], int]:
    """List notifications for a user with pagination.

    Args:
        db: Async database session.
        user_id: UUID of the authenticated user.
        skip: Offset for pagination.
        limit: Max results.
        unread_only: If True, only return unread notifications.

    Returns:
        Tuple of (notifications, total count).
    """
    base = select(Notification).where(Notification.user_id == user_id)

    if unread_only:
        base = base.where(Notification.is_read.is_(False))

    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        base.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all()), total


async def get_unread_count(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> int:
    """Get the count of unread notifications for a user.

    Args:
        db: Async database session.
        user_id: UUID of the authenticated user.

    Returns:
        Number of unread notifications.
    """
    result = await db.execute(
        select(func.count()).where(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        )
    )
    return result.scalar() or 0


async def mark_read(
    db: AsyncSession,
    notification_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Notification:
    """Mark a single notification as read.

    Args:
        db: Async database session.
        notification_id: UUID of the notification.
        user_id: UUID of the authenticated user.

    Returns:
        Updated Notification.

    Raises:
        HTTPException 404: If notification not found or not owned by user.
    """
    result = await db.execute(
        select(Notification).where(
            Notification.notification_id == notification_id,
            Notification.user_id == user_id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    notification.is_read = True
    notification.read_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(notification)
    return notification


async def mark_all_read(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> int:
    """Mark all unread notifications as read for a user.

    Args:
        db: Async database session.
        user_id: UUID of the authenticated user.

    Returns:
        Number of notifications marked as read.
    """
    now = datetime.now(timezone.utc)
    result = await db.execute(
        update(Notification)
        .where(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        )
        .values(is_read=True, read_at=now)
    )
    await db.commit()
    return result.rowcount
