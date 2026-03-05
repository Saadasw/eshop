"""Wishlist API routes — add, remove, list."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.wishlist import WishlistItemAdd, WishlistItemRead
from app.services import wishlist_service

router = APIRouter(tags=["Wishlist"])


@router.post(
    "/wishlist",
    response_model=WishlistItemRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_to_wishlist(
    data: WishlistItemAdd,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WishlistItemRead:
    """Add a product to the current user's wishlist."""
    item = await wishlist_service.add_to_wishlist(
        db, user.user_id, data.product_id, data.shop_id
    )
    return WishlistItemRead.model_validate(item)


@router.get(
    "/wishlist",
    response_model=PaginatedResponse[WishlistItemRead],
)
async def list_wishlist(
    user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[WishlistItemRead]:
    """List the current user's wishlist with product info."""
    items, total = await wishlist_service.list_wishlist(db, user.user_id, skip, limit)
    return PaginatedResponse(
        items=[WishlistItemRead(**item) for item in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.delete(
    "/wishlist/{wishlist_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_from_wishlist(
    wishlist_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Remove a product from the wishlist."""
    await wishlist_service.remove_from_wishlist(db, user.user_id, wishlist_id)
