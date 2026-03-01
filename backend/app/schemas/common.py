"""Shared Pydantic schemas used across multiple domains."""

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ErrorResponse(BaseModel):
    """Standard error response body."""

    detail: str


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated list response with total count.

    Attributes:
        items: The list of results for the current page.
        total: Total number of matching records.
        skip: Offset applied.
        limit: Page size.
    """

    items: list[T]
    total: int
    skip: int
    limit: int
