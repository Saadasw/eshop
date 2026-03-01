"""Pydantic schemas for auth and user operations."""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import UserRole


# --- Auth Request Schemas ---


class RegisterRequest(BaseModel):
    """Request body for POST /auth/register.

    The client sends the Supabase access token plus profile data.
    """

    supabase_token: str = Field(..., description="Access token from Supabase Auth")
    full_name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(..., min_length=11, max_length=20)
    password: str | None = Field(None, min_length=6, max_length=128)

    @field_validator("phone")
    @classmethod
    def validate_bd_phone(cls, v: str) -> str:
        """Validate Bangladeshi phone number format (01XXXXXXXXX)."""
        import re

        if not re.match(r"^01[3-9]\d{8}$", v):
            raise ValueError("Phone must be a valid BD number (01XXXXXXXXX)")
        return v


class LoginRequest(BaseModel):
    """Request body for POST /auth/login.

    The client sends the Supabase access token obtained after
    Supabase signInWithPassword or OTP verification.
    """

    supabase_token: str = Field(..., description="Access token from Supabase Auth")
    ip_address: str | None = Field(None, max_length=45)
    user_agent: str | None = None
    device_type: str | None = Field(None, pattern="^(mobile|desktop|tablet)$")
    device_name: str | None = Field(None, max_length=100)


class RefreshRequest(BaseModel):
    """Request body for POST /auth/refresh."""

    refresh_token: str


# --- Auth Response Schemas ---


class TokenPair(BaseModel):
    """Access + refresh token pair returned on login/register."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Access token lifetime in seconds")


class AuthResponse(BaseModel):
    """Full auth response with tokens and user info."""

    tokens: TokenPair
    user: "UserRead"


# --- User Schemas ---


class UserRead(BaseModel):
    """Public user representation returned from API endpoints."""

    user_id: uuid.UUID
    full_name: str
    email: str
    phone: str
    primary_role: UserRole
    avatar_url: str | None = None
    preferred_language: str
    is_verified: bool
    is_active: bool
    last_login_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """Fields a user can update on their own profile."""

    full_name: str | None = Field(None, min_length=1, max_length=120)
    avatar_url: str | None = None
    preferred_language: str | None = Field(None, max_length=5)

    @field_validator("preferred_language")
    @classmethod
    def validate_language(cls, v: str | None) -> str | None:
        """Only allow supported languages."""
        if v is not None and v not in ("bn", "en"):
            raise ValueError("Language must be 'bn' or 'en'")
        return v


# Rebuild forward ref
AuthResponse.model_rebuild()
