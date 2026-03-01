"""Category API routes — CRUD under /shops/{slug}/categories."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_shop, get_current_user
from app.models.shop import Shop
from app.models.user import User
from app.schemas.product import CategoryCreate, CategoryRead, CategoryUpdate
from app.services import category_service
from app.services.shop_service import require_shop_owner_or_staff

router = APIRouter(prefix="/shops/{slug}/categories", tags=["Categories"])


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CategoryRead:
    """Create a category for a shop. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    try:
        category = await category_service.create_category(db, shop.shop_id, data)
        return CategoryRead.model_validate(category)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=list[CategoryRead])
async def list_categories(
    shop: Shop = Depends(get_current_shop),
    include_inactive: bool = Query(False),
    db: AsyncSession = Depends(get_db),
) -> list[CategoryRead]:
    """List categories for a shop (public)."""
    categories = await category_service.list_categories(db, shop.shop_id, include_inactive)
    return [CategoryRead.model_validate(c) for c in categories]


@router.get("/{category_id}", response_model=CategoryRead)
async def get_category(
    category_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    db: AsyncSession = Depends(get_db),
) -> CategoryRead:
    """Get a single category (public)."""
    category = await category_service.get_category(db, shop.shop_id, category_id)
    return CategoryRead.model_validate(category)


@router.patch("/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CategoryRead:
    """Update a category. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    try:
        category = await category_service.update_category(
            db, shop.shop_id, category_id, data
        )
        return CategoryRead.model_validate(category)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Soft-delete a category. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    await category_service.delete_category(db, shop.shop_id, category_id, user.user_id)
