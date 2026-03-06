"""Admin API routes — shop approval, user management, platform settings, audit logs."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.enums import AuditAction, ShopStatus, UserRole
from app.models.user import User
from app.schemas.admin import (
    AdminDashboardStats,
    AuditLogRead,
    PlatformSettingRead,
    PlatformSettingUpdate,
    ShopAdminRead,
    ShopApprovalRequest,
    UserAdminRead,
    UserAdminUpdate,
)
from app.schemas.common import PaginatedResponse
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["Admin"])


# --- Dashboard Stats ---


@router.get("/stats", response_model=AdminDashboardStats)
async def get_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AdminDashboardStats:
    """Get aggregated platform statistics. Admin only."""
    admin_service.require_admin(user)
    stats = await admin_service.get_dashboard_stats(db)
    return AdminDashboardStats(**stats)


# --- Shop Management ---


@router.get("/shops", response_model=PaginatedResponse[ShopAdminRead])
async def list_shops(
    user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: ShopStatus | None = Query(None, alias="status"),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ShopAdminRead]:
    """List all shops for admin management."""
    admin_service.require_admin(user)
    shops, total = await admin_service.list_shops_admin(
        db, skip, limit, status_filter, search
    )
    return PaginatedResponse(
        items=[ShopAdminRead.model_validate(s) for s in shops],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.patch("/shops/{shop_id}/status", response_model=ShopAdminRead)
async def update_shop_status(
    shop_id: uuid.UUID,
    data: ShopApprovalRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ShopAdminRead:
    """Update a shop's status (approve, reject, suspend, ban). Admin only."""
    admin_service.require_admin(user)
    shop = await admin_service.update_shop_status(
        db, shop_id, user.user_id, data
    )
    return ShopAdminRead.model_validate(shop)


# --- User Management ---


@router.get("/users", response_model=PaginatedResponse[UserAdminRead])
async def list_users(
    user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    role: UserRole | None = Query(None),
    search: str | None = Query(None),
    is_active: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[UserAdminRead]:
    """List all users for admin management."""
    admin_service.require_admin(user)
    users, total = await admin_service.list_users(
        db, skip, limit, role, search, is_active
    )
    return PaginatedResponse(
        items=[UserAdminRead.model_validate(u) for u in users],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.patch("/users/{user_id}", response_model=UserAdminRead)
async def update_user(
    user_id: uuid.UUID,
    data: UserAdminUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserAdminRead:
    """Update a user's active status or role. Admin only."""
    admin_service.require_admin(user)
    updated = await admin_service.update_user_admin(
        db, user_id, user.user_id, data
    )
    return UserAdminRead.model_validate(updated)


# --- Platform Settings ---


@router.get("/settings", response_model=list[PlatformSettingRead])
async def list_settings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PlatformSettingRead]:
    """List all platform settings. Admin only."""
    admin_service.require_admin(user)
    settings = await admin_service.list_settings(db)
    return [PlatformSettingRead.model_validate(s) for s in settings]


@router.put("/settings/{key}", response_model=PlatformSettingRead)
async def upsert_setting(
    key: str,
    data: PlatformSettingUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PlatformSettingRead:
    """Create or update a platform setting. Admin only."""
    admin_service.require_admin(user)
    setting = await admin_service.upsert_setting(db, key, user.user_id, data)
    return PlatformSettingRead.model_validate(setting)


# --- Audit Logs ---


@router.get("/audit-logs", response_model=PaginatedResponse[AuditLogRead])
async def list_audit_logs(
    user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    entity_type: str | None = Query(None),
    action: AuditAction | None = Query(None),
    audit_user_id: uuid.UUID | None = Query(None, alias="user_id"),
    shop_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AuditLogRead]:
    """List audit logs with optional filters. Admin only."""
    admin_service.require_admin(user)
    logs, total = await admin_service.list_audit_logs(
        db, skip, limit, entity_type, action, audit_user_id, shop_id
    )
    return PaginatedResponse(
        items=[AuditLogRead.model_validate(log) for log in logs],
        total=total,
        skip=skip,
        limit=limit,
    )
