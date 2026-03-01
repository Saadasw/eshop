"""Cart API routes — per-shop cart operations."""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_shop, get_current_user
from app.models.shop import Shop
from app.models.user import User
from app.schemas.cart import CartItemAdd, CartItemUpdate, CartRead
from app.services import cart_service

router = APIRouter(prefix="/shops/{slug}/cart", tags=["Cart"])


@router.get("", response_model=CartRead)
async def get_cart(
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartRead:
    """Get the current user's cart for this shop."""
    return await cart_service.get_cart_read(db, shop.shop_id, user.user_id)


@router.post("/items", response_model=CartRead, status_code=status.HTTP_201_CREATED)
async def add_item(
    data: CartItemAdd,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartRead:
    """Add an item to the cart (or increment quantity if already present)."""
    return await cart_service.add_item(
        db, shop.shop_id, user.user_id, data.variant_id, data.quantity
    )


@router.patch("/items/{cart_item_id}", response_model=CartRead)
async def update_item(
    cart_item_id: uuid.UUID,
    data: CartItemUpdate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartRead:
    """Update the quantity of a cart item."""
    return await cart_service.update_item_quantity(
        db, shop.shop_id, user.user_id, cart_item_id, data.quantity
    )


@router.delete("/items/{cart_item_id}", response_model=CartRead)
async def remove_item(
    cart_item_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartRead:
    """Remove an item from the cart."""
    return await cart_service.remove_item(
        db, shop.shop_id, user.user_id, cart_item_id
    )


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Remove all items from the cart."""
    await cart_service.clear_cart(db, shop.shop_id, user.user_id)


@router.post("/merge", response_model=CartRead)
async def merge_guest_cart(
    session_id: str,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartRead:
    """Merge a guest (session-based) cart into the authenticated user's cart."""
    return await cart_service.merge_guest_cart(
        db, shop.shop_id, user.user_id, session_id
    )
