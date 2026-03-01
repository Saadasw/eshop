"""Category service — CRUD for shop-scoped categories."""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Category
from app.schemas.product import CategoryCreate, CategoryUpdate


async def create_category(
    db: AsyncSession, shop_id: uuid.UUID, data: CategoryCreate
) -> Category:
    """Create a category scoped to a shop.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        data: Category creation data.

    Returns:
        Created Category instance.

    Raises:
        ValueError: If slug already exists within the shop.
    """
    existing = await db.execute(
        select(Category).where(
            Category.shop_id == shop_id,
            Category.slug == data.slug,
            Category.deleted_at.is_(None),
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError(f"Category slug '{data.slug}' already exists in this shop")

    # Validate parent_id belongs to the same shop if provided
    if data.parent_id:
        parent_result = await db.execute(
            select(Category).where(
                Category.category_id == data.parent_id,
                Category.shop_id == shop_id,
                Category.deleted_at.is_(None),
            )
        )
        if not parent_result.scalar_one_or_none():
            raise ValueError("Parent category not found in this shop")

    category = Category(shop_id=shop_id, **data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


async def list_categories(
    db: AsyncSession,
    shop_id: uuid.UUID,
    include_inactive: bool = False,
) -> list[Category]:
    """List all categories for a shop.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        include_inactive: Whether to include inactive categories.

    Returns:
        List of Category instances sorted by sort_order.
    """
    query = select(Category).where(
        Category.shop_id == shop_id,
        Category.deleted_at.is_(None),
    )
    if not include_inactive:
        query = query.where(Category.is_active.is_(True))

    query = query.order_by(Category.sort_order, Category.name)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_category(
    db: AsyncSession, shop_id: uuid.UUID, category_id: uuid.UUID
) -> Category:
    """Get a single category by ID, scoped to a shop.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        category_id: UUID of the category.

    Returns:
        Category instance.

    Raises:
        HTTPException 404: If not found.
    """
    result = await db.execute(
        select(Category).where(
            Category.category_id == category_id,
            Category.shop_id == shop_id,
            Category.deleted_at.is_(None),
        )
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )
    return category


async def update_category(
    db: AsyncSession,
    shop_id: uuid.UUID,
    category_id: uuid.UUID,
    data: CategoryUpdate,
) -> Category:
    """Update a category.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        category_id: UUID of the category.
        data: Partial update data.

    Returns:
        Updated Category instance.
    """
    category = await get_category(db, shop_id, category_id)

    update_data = data.model_dump(exclude_unset=True)

    # If slug is being changed, validate uniqueness
    if "slug" in update_data:
        existing = await db.execute(
            select(Category).where(
                Category.shop_id == shop_id,
                Category.slug == update_data["slug"],
                Category.category_id != category_id,
                Category.deleted_at.is_(None),
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError(f"Category slug '{update_data['slug']}' already exists")

    for key, value in update_data.items():
        setattr(category, key, value)
    await db.commit()
    await db.refresh(category)
    return category


async def delete_category(
    db: AsyncSession,
    shop_id: uuid.UUID,
    category_id: uuid.UUID,
    deleted_by: uuid.UUID,
) -> None:
    """Soft-delete a category.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        category_id: UUID of the category.
        deleted_by: UUID of the user performing the deletion.
    """
    category = await get_category(db, shop_id, category_id)
    category.deleted_at = datetime.now(timezone.utc)
    category.deleted_by = deleted_by
    await db.commit()
