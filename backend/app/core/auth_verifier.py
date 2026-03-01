"""Vendor-agnostic external auth token verification.

AuthVerifier is a Protocol that any auth provider must implement.
SupabaseAuthVerifier is the default implementation using Supabase Auth.

Only used during register/login to verify the external provider's token.
After verification, our own JWT is issued — all subsequent requests use our JWT.
"""

from typing import Protocol

import httpx

from app.config import settings


class AuthVerifier(Protocol):
    """Protocol for verifying external auth provider tokens."""

    async def verify_token(self, token: str) -> dict:
        """Verify an external auth token and return user info.

        Args:
            token: Access token from the external auth provider.

        Returns:
            Dict with at least 'sub' (user ID), and optionally
            'email' and 'phone'.

        Raises:
            ValueError: If the token is invalid or expired.
        """
        ...


class SupabaseAuthVerifier:
    """Supabase Auth implementation of AuthVerifier."""

    def __init__(self) -> None:
        """Initialize with Supabase credentials from settings."""
        self.base_url = f"{settings.SUPABASE_URL}/auth/v1"
        self.headers = {
            "apikey": settings.SUPABASE_ANON_KEY,
        }

    async def verify_token(self, token: str) -> dict:
        """Verify a Supabase access token by calling the /user endpoint.

        Args:
            token: Supabase access token.

        Returns:
            Dict with 'sub', 'email', and 'phone' from the Supabase user.

        Raises:
            ValueError: If the token is invalid or the request fails.
        """
        url = f"{self.base_url}/user"
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers={
                    **self.headers,
                    "Authorization": f"Bearer {token}",
                },
            )
            if response.status_code != 200:
                raise ValueError("Invalid or expired Supabase token")

            data = response.json()
            return {
                "sub": data["id"],
                "email": data.get("email", ""),
                "phone": data.get("phone", ""),
            }
