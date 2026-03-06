"""Pydantic schemas for admin operations."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import AuditAction, ShopStatus, UserRole


# --- Shop Approval ---


class ShopApprovalRequest(BaseModel):
    """Request body for approving/rejecting/suspending a shop."""

    status: ShopStatus
    rejection_reason: str | None = None


class ShopAdminRead(BaseModel):
    """Shop representation for admin listing."""

    shop_id: uuid.UUID
    owner_id: uuid.UUID
    slug: str
    shop_name: str
    status: ShopStatus
    contact_email: str | None = None
    contact_phone: str | None = None
    trade_license_no: str | None = None
    reviewed_by: uuid.UUID | None = None
    reviewed_at: datetime | None = None
    rejection_reason: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- User Management ---


class UserAdminRead(BaseModel):
    """User representation for admin listing."""

    user_id: uuid.UUID
    full_name: str
    email: str
    phone: str
    primary_role: UserRole
    is_active: bool
    is_verified: bool
    last_login_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserAdminUpdate(BaseModel):
    """Request body for admin user management."""

    is_active: bool | None = None
    primary_role: UserRole | None = None


# --- Platform Settings ---


class PlatformSettingRead(BaseModel):
    """Platform setting representation."""

    key: str
    value: dict
    description: str | None = None
    updated_by: uuid.UUID | None = None
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlatformSettingUpdate(BaseModel):
    """Request body for updating a platform setting."""

    value: dict
    description: str | None = None


# --- Audit Logs ---


class AuditLogRead(BaseModel):
    """Audit log entry representation."""

    log_id: uuid.UUID
    user_id: uuid.UUID | None = None
    shop_id: uuid.UUID | None = None
    entity_type: str
    entity_id: uuid.UUID
    action: AuditAction
    old_values: dict | None = None
    new_values: dict | None = None
    ip_address: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Dashboard Stats ---


class AdminDashboardStats(BaseModel):
    """Aggregated stats for admin dashboard."""

    total_users: int
    total_shops: int
    pending_shops: int
    active_shops: int
    total_orders: int
    total_revenue: float
