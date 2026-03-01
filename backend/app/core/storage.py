"""Vendor-agnostic file storage abstraction.

StorageBackend is a Protocol that any storage provider must implement.
SupabaseStorage is the default implementation using Supabase Storage.
"""

from typing import Protocol

import httpx

from app.config import settings


class StorageBackend(Protocol):
    """Protocol for file storage operations."""

    async def upload(self, bucket: str, path: str, file: bytes, content_type: str) -> str:
        """Upload a file and return its public URL.

        Args:
            bucket: Storage bucket name (e.g. 'product-images').
            path: File path within the bucket.
            file: Raw file bytes.
            content_type: MIME type (e.g. 'image/jpeg').

        Returns:
            Public URL of the uploaded file.
        """
        ...

    async def get_url(self, bucket: str, path: str) -> str:
        """Get the public or signed URL for a stored file.

        Args:
            bucket: Storage bucket name.
            path: File path within the bucket.

        Returns:
            Accessible URL for the file.
        """
        ...

    async def delete(self, bucket: str, path: str) -> None:
        """Delete a file from storage.

        Args:
            bucket: Storage bucket name.
            path: File path within the bucket.
        """
        ...


class SupabaseStorage:
    """Supabase Storage implementation of StorageBackend."""

    def __init__(self) -> None:
        """Initialize with Supabase credentials from settings."""
        self.base_url = f"{settings.SUPABASE_URL}/storage/v1"
        self.headers = {
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        }

    async def upload(self, bucket: str, path: str, file: bytes, content_type: str) -> str:
        """Upload a file to Supabase Storage.

        Args:
            bucket: Storage bucket name.
            path: File path within the bucket.
            file: Raw file bytes.
            content_type: MIME type.

        Returns:
            Public URL of the uploaded file.
        """
        url = f"{self.base_url}/object/{bucket}/{path}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                content=file,
                headers={
                    **self.headers,
                    "Content-Type": content_type,
                    "x-upsert": "true",
                },
            )
            response.raise_for_status()
        return await self.get_url(bucket, path)

    async def get_url(self, bucket: str, path: str) -> str:
        """Get public URL for a file in Supabase Storage.

        Args:
            bucket: Storage bucket name.
            path: File path within the bucket.

        Returns:
            Public URL for the file.
        """
        return f"{self.base_url}/object/public/{bucket}/{path}"

    async def delete(self, bucket: str, path: str) -> None:
        """Delete a file from Supabase Storage.

        Args:
            bucket: Storage bucket name.
            path: File path within the bucket.
        """
        url = f"{self.base_url}/object/{bucket}/{path}"
        async with httpx.AsyncClient() as client:
            response = await client.delete(url, headers=self.headers)
            response.raise_for_status()
