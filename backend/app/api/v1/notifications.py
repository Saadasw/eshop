"""Notification API routes — list, mark read, unread count."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.notification import (
    NotificationMarkRead,
    NotificationRead,
    UnreadCountResponse,
)
from app.services import notification_service

router = APIRouter(tags=["Notifications"])


@router.get(
    "/notifications",
    response_model=PaginatedResponse[NotificationRead],
)
async def list_notifications(
    user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[NotificationRead]:
    """List notifications for the current user."""
    notifications, total = await notification_service.list_notifications(
        db, user.user_id, skip, limit, unread_only
    )
    return PaginatedResponse(
        items=[NotificationRead.model_validate(n) for n in notifications],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/notifications/unread-count",
    response_model=UnreadCountResponse,
)
async def get_unread_count(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UnreadCountResponse:
    """Get the count of unread notifications."""
    count = await notification_service.get_unread_count(db, user.user_id)
    return UnreadCountResponse(count=count)


@router.patch(
    "/notifications/{notification_id}/read",
    response_model=NotificationRead,
)
async def mark_notification_read(
    notification_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationRead:
    """Mark a single notification as read."""
    notification = await notification_service.mark_read(
        db, notification_id, user.user_id
    )
    return NotificationRead.model_validate(notification)


@router.post(
    "/notifications/mark-all-read",
    status_code=status.HTTP_200_OK,
)
async def mark_all_read(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Mark all unread notifications as read."""
    count = await notification_service.mark_all_read(db, user.user_id)
    return {"marked_read": count}
