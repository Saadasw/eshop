"""Authentication service — register, login, refresh, logout."""

import hashlib
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.auth_verifier import AuthVerifier
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
)
from app.models.enums import DeviceType, UserRole
from app.models.user import LoginAttempt, PasswordHistory, User, UserSession
from app.schemas.user import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    TokenPair,
    UserRead,
)


def _hash_refresh_token(token: str) -> str:
    """SHA-256 hash a refresh token for safe DB storage.

    Args:
        token: The raw refresh JWT string.

    Returns:
        Hex-encoded SHA-256 hash.
    """
    return hashlib.sha256(token.encode()).hexdigest()


class AuthService:
    """Handles user registration, login, token refresh, and logout."""

    def __init__(self, auth_verifier: AuthVerifier) -> None:
        """Initialize with an auth verifier implementation.

        Args:
            auth_verifier: External auth token verifier (e.g. SupabaseAuthVerifier).
        """
        self.auth_verifier = auth_verifier

    async def register(
        self, db: AsyncSession, data: RegisterRequest
    ) -> AuthResponse:
        """Register a new user after verifying their Supabase token.

        Args:
            db: Async database session.
            data: Registration request with Supabase token and profile data.

        Returns:
            AuthResponse with token pair and user info.

        Raises:
            ValueError: If the token is invalid or email/phone already exists.
        """
        # 1. Verify Supabase token
        ext_user = await self.auth_verifier.verify_token(data.supabase_token)

        # 2. Check for existing user by email or phone
        existing = await db.execute(
            select(User).where(
                (User.email == data.email) | (User.phone == data.phone),
                User.deleted_at.is_(None),
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("A user with this email or phone already exists")

        # 3. Create user record
        user = User(
            full_name=data.full_name,
            email=data.email,
            phone=data.phone,
            password_hash=hash_password(data.password) if data.password else None,
            primary_role=UserRole.CUSTOMER,
            is_verified=True,
        )
        db.add(user)

        # 4. Store password history if password was provided
        if data.password:
            db.add(PasswordHistory(
                user_id=user.user_id,
                password_hash=user.password_hash,  # type: ignore[arg-type]
            ))

        await db.flush()

        # 5. Issue our own tokens
        tokens = self._issue_tokens(user)

        # 6. Create session
        await self._create_session(db, user.user_id, tokens.refresh_token)

        await db.commit()

        return AuthResponse(
            tokens=tokens,
            user=UserRead.model_validate(user),
        )

    async def login(
        self, db: AsyncSession, data: LoginRequest
    ) -> AuthResponse:
        """Log in a user after verifying their Supabase token.

        Args:
            db: Async database session.
            data: Login request with Supabase token and device info.

        Returns:
            AuthResponse with token pair and user info.

        Raises:
            ValueError: If the token is invalid, user not found, or account locked.
        """
        # 1. Verify Supabase token
        ext_user = await self.auth_verifier.verify_token(data.supabase_token)
        email = ext_user.get("email", "")

        # 2. Find user by email
        result = await db.execute(
            select(User).where(User.email == email, User.deleted_at.is_(None))
        )
        user = result.scalar_one_or_none()

        if not user:
            await self._record_login_attempt(
                db, email, None, data.ip_address, data.user_agent, False, "user_not_found"
            )
            raise ValueError("No account found for this email")

        # 3. Check account lockout
        if user.locked_until and user.locked_until > datetime.now(timezone.utc):
            await self._record_login_attempt(
                db, email, user.user_id, data.ip_address, data.user_agent,
                False, "account_locked",
            )
            raise ValueError("Account is temporarily locked. Try again later.")

        # 4. Check if account is active
        if not user.is_active:
            await self._record_login_attempt(
                db, email, user.user_id, data.ip_address, data.user_agent,
                False, "account_inactive",
            )
            raise ValueError("Account is deactivated")

        # 5. Successful login — reset failed attempts, update last_login
        user.failed_login_count = 0
        user.locked_until = None
        user.last_login_at = datetime.now(timezone.utc)

        # 6. Issue tokens
        tokens = self._issue_tokens(user)

        # 7. Create session
        device = None
        if data.device_type:
            device = DeviceType(data.device_type)
        await self._create_session(
            db, user.user_id, tokens.refresh_token,
            ip_address=data.ip_address,
            user_agent=data.user_agent,
            device_type=device,
            device_name=data.device_name,
        )

        # 8. Record successful attempt
        await self._record_login_attempt(
            db, email, user.user_id, data.ip_address, data.user_agent, True, None
        )

        await db.commit()

        return AuthResponse(
            tokens=tokens,
            user=UserRead.model_validate(user),
        )

    async def refresh(self, db: AsyncSession, refresh_token: str) -> TokenPair:
        """Issue a new token pair using a valid refresh token.

        Args:
            db: Async database session.
            refresh_token: The current refresh JWT.

        Returns:
            New TokenPair with fresh access and refresh tokens.

        Raises:
            ValueError: If the refresh token is invalid, expired, or revoked.
        """
        # 1. Decode and validate
        try:
            payload = decode_token(refresh_token)
        except Exception:
            raise ValueError("Invalid or expired refresh token")

        if payload.get("type") != "refresh":
            raise ValueError("Token is not a refresh token")

        user_id = uuid.UUID(payload["sub"])

        # 2. Find active session by token hash
        token_hash = _hash_refresh_token(refresh_token)
        result = await db.execute(
            select(UserSession).where(
                UserSession.refresh_token_hash == token_hash,
                UserSession.is_active.is_(True),
                UserSession.user_id == user_id,
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            raise ValueError("Session not found or already revoked")

        # 3. Revoke old session
        session.is_active = False
        session.revoked_at = datetime.now(timezone.utc)

        # 4. Get user for role
        result = await db.execute(
            select(User).where(User.user_id == user_id, User.deleted_at.is_(None))
        )
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise ValueError("User not found or inactive")

        # 5. Issue new tokens
        tokens = self._issue_tokens(user)

        # 6. Create new session (rotate refresh token)
        await self._create_session(
            db, user_id, tokens.refresh_token,
            ip_address=session.ip_address,
            user_agent=session.user_agent,
            device_type=session.device_type,
            device_name=session.device_name,
        )

        await db.commit()
        return tokens

    async def logout(self, db: AsyncSession, refresh_token: str) -> None:
        """Revoke the session associated with a refresh token.

        Args:
            db: Async database session.
            refresh_token: The refresh JWT to revoke.
        """
        token_hash = _hash_refresh_token(refresh_token)
        result = await db.execute(
            select(UserSession).where(
                UserSession.refresh_token_hash == token_hash,
                UserSession.is_active.is_(True),
            )
        )
        session = result.scalar_one_or_none()
        if session:
            session.is_active = False
            session.revoked_at = datetime.now(timezone.utc)
            await db.commit()

    async def logout_all(self, db: AsyncSession, user_id: uuid.UUID) -> int:
        """Revoke all active sessions for a user.

        Args:
            db: Async database session.
            user_id: The user whose sessions to revoke.

        Returns:
            Number of sessions revoked.
        """
        result = await db.execute(
            select(UserSession).where(
                UserSession.user_id == user_id,
                UserSession.is_active.is_(True),
            )
        )
        sessions = result.scalars().all()
        now = datetime.now(timezone.utc)
        for s in sessions:
            s.is_active = False
            s.revoked_at = now
        await db.commit()
        return len(sessions)

    def _issue_tokens(self, user: User) -> TokenPair:
        """Create an access + refresh token pair for a user.

        Args:
            user: The User model instance.

        Returns:
            TokenPair with both tokens and expiry info.
        """
        access = create_access_token(user.user_id, user.primary_role.value)
        refresh = create_refresh_token(user.user_id)
        return TokenPair(
            access_token=access,
            refresh_token=refresh,
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def _create_session(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        refresh_token: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
        device_type: DeviceType | None = None,
        device_name: str | None = None,
    ) -> UserSession:
        """Persist a new user session with the hashed refresh token.

        Args:
            db: Async database session.
            user_id: The user's UUID.
            refresh_token: Raw refresh JWT (stored as hash).
            ip_address: Client IP.
            user_agent: Client user agent string.
            device_type: Device type enum value.
            device_name: Human-readable device name.

        Returns:
            The created UserSession instance.
        """
        session = UserSession(
            user_id=user_id,
            refresh_token_hash=_hash_refresh_token(refresh_token),
            ip_address=ip_address,
            user_agent=user_agent,
            device_type=device_type,
            device_name=device_name,
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
        )
        db.add(session)
        return session

    async def _record_login_attempt(
        self,
        db: AsyncSession,
        identifier: str,
        user_id: uuid.UUID | None,
        ip_address: str | None,
        user_agent: str | None,
        success: bool,
        failure_reason: str | None,
    ) -> None:
        """Record a login attempt for security auditing.

        Args:
            db: Async database session.
            identifier: Email or phone used in the attempt.
            user_id: User UUID if found, else None.
            ip_address: Client IP.
            user_agent: Client user agent.
            success: Whether the login succeeded.
            failure_reason: Reason for failure if unsuccessful.
        """
        attempt = LoginAttempt(
            identifier=identifier,
            user_id=user_id,
            ip_address=ip_address or "unknown",
            user_agent=user_agent,
            success=success,
            failure_reason=failure_reason,
        )
        db.add(attempt)

        # Increment failed count and lock if needed
        if not success and user_id:
            result = await db.execute(
                select(User).where(User.user_id == user_id)
            )
            user = result.scalar_one_or_none()
            if user:
                user.failed_login_count += 1
                if user.failed_login_count >= 5:
                    user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=30)
