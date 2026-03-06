"""Admin service — shop approval, user management, platform settings, audit logs, stats."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.state_machines import VALID_SHOP_TRANSITIONS, validate_transition
from app.models.audit import AuditLog, PlatformSetting
from app.models.enums import (
    AuditAction,
    NotificationType,
    OrderStatus,
    ShopStatus,
    UserRole,
)
from app.models.order import Order
from app.models.shop import Shop
from app.models.user import User
from app.schemas.admin import (
    PlatformSettingUpdate,
    ShopApprovalRequest,
    UserAdminUpdate,
)
from app.services import notification_service


def require_admin(user: User) -> None:
    """Raise 403 if the user is not an admin.

    Args:
        user: Authenticated user.
    """
    if user.primary_role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )


# --- Shop Approval ---


async def list_shops_admin(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    status_filter: ShopStatus | None = None,
    search: str | None = None,
) -> tuple[list[Shop], int]:
    """List all shops for admin with optional filters.

    Args:
        db: Async database session.
        skip: Offset for pagination.
        limit: Max results.
        status_filter: Optional filter by shop status.
        search: Optional search by shop name.

    Returns:
        Tuple of (shops, total count).
    """
    base = select(Shop).where(Shop.deleted_at.is_(None))

    if status_filter:
        base = base.where(Shop.status == status_filter)
    if search:
        base = base.where(Shop.shop_name.ilike(f"%{search}%"))

    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        base.order_by(Shop.created_at.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all()), total


async def update_shop_status(
    db: AsyncSession,
    shop_id: uuid.UUID,
    admin_id: uuid.UUID,
    data: ShopApprovalRequest,
) -> Shop:
    """Update a shop's status with state machine validation.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        admin_id: UUID of the admin performing the action.
        data: Status update request.

    Returns:
        Updated Shop.

    Raises:
        HTTPException 404: If shop not found.
        HTTPException 400: If the status transition is invalid.
    """
    result = await db.execute(
        select(Shop).where(Shop.shop_id == shop_id, Shop.deleted_at.is_(None))
    )
    shop = result.scalar_one_or_none()
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found",
        )

    if not validate_transition(shop.status, data.status, VALID_SHOP_TRANSITIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from '{shop.status.value}' to '{data.status.value}'",
        )

    old_status = shop.status
    shop.status = data.status
    shop.reviewed_by = admin_id
    shop.reviewed_at = datetime.now(timezone.utc)

    if data.status == ShopStatus.REJECTED and data.rejection_reason:
        shop.rejection_reason = data.rejection_reason

    # Create audit log
    db.add(AuditLog(
        user_id=admin_id,
        shop_id=shop_id,
        entity_type="shop",
        entity_id=shop_id,
        action=AuditAction.STATUS_CHANGE,
        old_values={"status": old_status.value},
        new_values={"status": data.status.value},
    ))

    # Notify shop owner
    status_messages = {
        ShopStatus.ACTIVE: "Your shop has been approved!",
        ShopStatus.REJECTED: f"Your shop was rejected: {data.rejection_reason or 'No reason provided'}",
        ShopStatus.SUSPENDED: "Your shop has been suspended. Contact support for details.",
        ShopStatus.BANNED: "Your shop has been banned.",
    }
    message = status_messages.get(data.status, f"Your shop status changed to {data.status.value}")

    await notification_service.create_notification(
        db,
        user_id=shop.owner_id,
        type=NotificationType.SYSTEM,
        title="Shop Status Update",
        message=message,
        shop_id=shop_id,
        reference_id=shop_id,
        reference_type="shop",
    )

    await db.commit()
    await db.refresh(shop)
    return shop


# --- User Management ---


async def list_users(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    role_filter: UserRole | None = None,
    search: str | None = None,
    is_active: bool | None = None,
) -> tuple[list[User], int]:
    """List all users for admin with optional filters.

    Args:
        db: Async database session.
        skip: Offset for pagination.
        limit: Max results.
        role_filter: Optional filter by user role.
        search: Optional search by name or email.
        is_active: Optional filter by active status.

    Returns:
        Tuple of (users, total count).
    """
    base = select(User).where(User.deleted_at.is_(None))

    if role_filter:
        base = base.where(User.primary_role == role_filter)
    if search:
        base = base.where(
            (User.full_name.ilike(f"%{search}%"))
            | (User.email.ilike(f"%{search}%"))
            | (User.phone.ilike(f"%{search}%"))
        )
    if is_active is not None:
        base = base.where(User.is_active == is_active)

    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        base.order_by(User.created_at.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all()), total


async def update_user_admin(
    db: AsyncSession,
    user_id: uuid.UUID,
    admin_id: uuid.UUID,
    data: UserAdminUpdate,
) -> User:
    """Update a user's active status or role (admin action).

    Args:
        db: Async database session.
        user_id: UUID of the user to update.
        admin_id: UUID of the admin performing the action.
        data: Update data.

    Returns:
        Updated User.

    Raises:
        HTTPException 404: If user not found.
        HTTPException 400: If trying to modify self.
    """
    if user_id == admin_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own account via admin endpoint",
        )

    result = await db.execute(
        select(User).where(User.user_id == user_id, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    old_values = {}
    new_values = {}

    if data.is_active is not None and data.is_active != user.is_active:
        old_values["is_active"] = user.is_active
        new_values["is_active"] = data.is_active
        user.is_active = data.is_active

    if data.primary_role is not None and data.primary_role != user.primary_role:
        old_values["primary_role"] = user.primary_role.value
        new_values["primary_role"] = data.primary_role.value
        user.primary_role = data.primary_role

    if old_values:
        db.add(AuditLog(
            user_id=admin_id,
            entity_type="user",
            entity_id=user_id,
            action=AuditAction.UPDATE,
            old_values=old_values,
            new_values=new_values,
        ))

    await db.commit()
    await db.refresh(user)
    return user


# --- Platform Settings ---


async def list_settings(db: AsyncSession) -> list[PlatformSetting]:
    """List all platform settings.

    Args:
        db: Async database session.

    Returns:
        List of all platform settings.
    """
    result = await db.execute(
        select(PlatformSetting).order_by(PlatformSetting.key)
    )
    return list(result.scalars().all())


async def get_setting(db: AsyncSession, key: str) -> PlatformSetting:
    """Get a single platform setting by key.

    Args:
        db: Async database session.
        key: Setting key.

    Returns:
        PlatformSetting instance.

    Raises:
        HTTPException 404: If setting not found.
    """
    result = await db.execute(
        select(PlatformSetting).where(PlatformSetting.key == key)
    )
    setting = result.scalar_one_or_none()
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting '{key}' not found",
        )
    return setting


async def upsert_setting(
    db: AsyncSession,
    key: str,
    admin_id: uuid.UUID,
    data: PlatformSettingUpdate,
) -> PlatformSetting:
    """Create or update a platform setting.

    Args:
        db: Async database session.
        key: Setting key.
        admin_id: UUID of the admin.
        data: Setting value and description.

    Returns:
        Created or updated PlatformSetting.
    """
    result = await db.execute(
        select(PlatformSetting).where(PlatformSetting.key == key)
    )
    setting = result.scalar_one_or_none()

    if setting:
        old_value = setting.value
        setting.value = data.value
        if data.description is not None:
            setting.description = data.description
        setting.updated_by = admin_id

        db.add(AuditLog(
            user_id=admin_id,
            entity_type="platform_setting",
            entity_id=uuid.uuid5(uuid.NAMESPACE_DNS, key),
            action=AuditAction.UPDATE,
            old_values={"value": old_value},
            new_values={"value": data.value},
        ))
    else:
        setting = PlatformSetting(
            key=key,
            value=data.value,
            description=data.description,
            updated_by=admin_id,
        )
        db.add(setting)

    await db.commit()
    await db.refresh(setting)
    return setting


# --- Audit Logs ---


async def list_audit_logs(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    entity_type: str | None = None,
    action: AuditAction | None = None,
    user_id: uuid.UUID | None = None,
    shop_id: uuid.UUID | None = None,
) -> tuple[list[AuditLog], int]:
    """List audit logs with optional filters.

    Args:
        db: Async database session.
        skip: Offset for pagination.
        limit: Max results.
        entity_type: Filter by entity type (e.g. "shop", "user").
        action: Filter by audit action.
        user_id: Filter by user who performed the action.
        shop_id: Filter by shop context.

    Returns:
        Tuple of (audit logs, total count).
    """
    base = select(AuditLog)

    if entity_type:
        base = base.where(AuditLog.entity_type == entity_type)
    if action:
        base = base.where(AuditLog.action == action)
    if user_id:
        base = base.where(AuditLog.user_id == user_id)
    if shop_id:
        base = base.where(AuditLog.shop_id == shop_id)

    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        base.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all()), total


# --- Dashboard Stats ---


async def get_dashboard_stats(db: AsyncSession) -> dict:
    """Get aggregated platform stats for admin dashboard.

    Args:
        db: Async database session.

    Returns:
        Dict with total_users, total_shops, pending_shops, active_shops,
        total_orders, total_revenue.
    """
    users_count = await db.execute(
        select(func.count()).select_from(
            select(User.user_id).where(User.deleted_at.is_(None)).subquery()
        )
    )
    total_users = users_count.scalar() or 0

    shops_count = await db.execute(
        select(func.count()).select_from(
            select(Shop.shop_id).where(Shop.deleted_at.is_(None)).subquery()
        )
    )
    total_shops = shops_count.scalar() or 0

    pending_count = await db.execute(
        select(func.count()).select_from(
            select(Shop.shop_id).where(
                Shop.deleted_at.is_(None),
                Shop.status == ShopStatus.PENDING,
            ).subquery()
        )
    )
    pending_shops = pending_count.scalar() or 0

    active_count = await db.execute(
        select(func.count()).select_from(
            select(Shop.shop_id).where(
                Shop.deleted_at.is_(None),
                Shop.status == ShopStatus.ACTIVE,
            ).subquery()
        )
    )
    active_shops = active_count.scalar() or 0

    orders_count = await db.execute(
        select(func.count()).select_from(
            select(Order.order_id).where(Order.deleted_at.is_(None)).subquery()
        )
    )
    total_orders = orders_count.scalar() or 0

    revenue_result = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), Decimal("0"))).where(
            Order.deleted_at.is_(None),
            Order.status == OrderStatus.DELIVERED,
        )
    )
    total_revenue = float(revenue_result.scalar() or 0)

    return {
        "total_users": total_users,
        "total_shops": total_shops,
        "pending_shops": pending_shops,
        "active_shops": active_shops,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
    }
