"""FastAPI dependencies shared across routes."""

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth_verifier import SupabaseAuthVerifier
from app.core.security import decode_token
from app.core.storage import SupabaseStorage, StorageBackend
from app.db.session import get_db
from app.models.shop import Shop
from app.models.user import User
from app.services.auth_service import AuthService

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Decode the JWT access token and return the authenticated User.

    Args:
        credentials: Bearer token from the Authorization header.
        db: Async database session.

    Returns:
        The authenticated User model instance.

    Raises:
        HTTPException 401: If the token is invalid, expired, or user not found.
    """
    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id = uuid.UUID(payload["sub"])
    result = await db.execute(
        select(User).where(User.user_id == user_id, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


async def get_current_shop(slug: str, db: AsyncSession = Depends(get_db)) -> Shop:
    """Resolve a shop slug to a Shop model instance.

    Args:
        slug: The shop's URL slug from the path parameter.
        db: Async database session.

    Returns:
        The Shop model instance.

    Raises:
        HTTPException 404: If the shop does not exist or is soft-deleted.
    """
    result = await db.execute(
        select(Shop).where(Shop.slug == slug, Shop.deleted_at.is_(None))
    )
    shop = result.scalar_one_or_none()

    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found",
        )

    return shop


def get_auth_service() -> AuthService:
    """Provide an AuthService instance with the default Supabase verifier.

    Returns:
        Configured AuthService.
    """
    return AuthService(auth_verifier=SupabaseAuthVerifier())


def get_storage() -> StorageBackend:
    """Provide the default storage backend.

    Returns:
        Configured SupabaseStorage instance.
    """
    return SupabaseStorage()
