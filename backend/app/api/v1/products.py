"""Product API routes — CRUD, variants, media, attributes."""

import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import StorageBackend
from app.db.session import get_db
from app.dependencies import get_current_shop, get_current_user, get_storage
from app.models.shop import Shop
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.product import (
    AttributeCreate,
    AttributeOptionCreate,
    AttributeOptionRead,
    AttributeRead,
    ProductCreate,
    ProductMediaRead,
    ProductRead,
    ProductUpdate,
    VariantCreate,
    VariantRead,
    VariantUpdate,
)
from app.services import product_service
from app.services.shop_service import require_shop_owner_or_staff

router = APIRouter(prefix="/shops/{slug}", tags=["Products"])


# --- Products ---


@router.post(
    "/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED
)
async def create_product(
    data: ProductCreate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProductRead:
    """Create a product with optional variants. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    try:
        product = await product_service.create_product(db, shop.shop_id, data)
        return ProductRead.model_validate(product)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/products", response_model=PaginatedResponse[ProductRead])
async def list_products(
    shop: Shop = Depends(get_current_shop),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category_id: uuid.UUID | None = None,
    search: str | None = None,
    is_active: bool | None = True,
    is_featured: bool | None = None,
    sort_by: str = Query("created_at", pattern="^(created_at|name|base_price|price_desc|avg_rating|total_sales)$"),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ProductRead]:
    """List products for a shop with filters (public)."""
    products, total = await product_service.list_products(
        db, shop.shop_id, skip, limit, category_id, search, is_active, is_featured, sort_by
    )
    return PaginatedResponse(
        items=[ProductRead.model_validate(p) for p in products],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/products/{product_id}", response_model=ProductRead)
async def get_product(
    product_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    db: AsyncSession = Depends(get_db),
) -> ProductRead:
    """Get product detail with variants, media, and tags (public)."""
    product = await product_service.get_product(db, shop.shop_id, product_id)
    return ProductRead.model_validate(product)


@router.patch("/products/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProductRead:
    """Update a product. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    try:
        product = await product_service.update_product(
            db, shop.shop_id, product_id, data
        )
        return ProductRead.model_validate(product)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_product(
    product_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Soft-delete a product and its variants. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    await product_service.delete_product(db, shop.shop_id, product_id, user.user_id)


# --- Variants ---


@router.post(
    "/products/{product_id}/variants",
    response_model=VariantRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_variant(
    product_id: uuid.UUID,
    data: VariantCreate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VariantRead:
    """Add a variant to a product. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    variant = await product_service.add_variant(db, shop.shop_id, product_id, data)
    return VariantRead.model_validate(variant)


@router.patch(
    "/products/{product_id}/variants/{variant_id}", response_model=VariantRead
)
async def update_variant(
    product_id: uuid.UUID,
    variant_id: uuid.UUID,
    data: VariantUpdate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VariantRead:
    """Update a product variant. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    variant = await product_service.update_variant(
        db, shop.shop_id, product_id, variant_id, data
    )
    return VariantRead.model_validate(variant)


@router.delete(
    "/products/{product_id}/variants/{variant_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_variant(
    product_id: uuid.UUID,
    variant_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Soft-delete a product variant. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    await product_service.delete_variant(
        db, shop.shop_id, product_id, variant_id, user.user_id
    )


# --- Product Media ---


@router.post(
    "/products/{product_id}/media",
    response_model=ProductMediaRead,
    status_code=status.HTTP_201_CREATED,
)
async def upload_media(
    product_id: uuid.UUID,
    file: UploadFile,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    alt_text: str | None = Form(None),
    is_primary: bool = Form(False),
) -> ProductMediaRead:
    """Upload product media (image/video). Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    file_bytes = await file.read()
    media = await product_service.upload_media(
        db,
        shop.shop_id,
        product_id,
        file_bytes,
        file.content_type or "application/octet-stream",
        file.filename or "upload",
        storage,
        alt_text=alt_text,
        is_primary=is_primary,
    )
    return ProductMediaRead.model_validate(media)


@router.delete(
    "/products/{product_id}/media/{media_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_media(
    product_id: uuid.UUID,
    media_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> None:
    """Delete product media. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    await product_service.delete_media(db, product_id, media_id, storage)


@router.patch(
    "/products/{product_id}/media/{media_id}/primary",
    response_model=ProductMediaRead,
)
async def set_primary_media(
    product_id: uuid.UUID,
    media_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProductMediaRead:
    """Set a media item as the primary image. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    media = await product_service.set_primary_media(db, product_id, media_id)
    return ProductMediaRead.model_validate(media)


# --- Attributes ---


@router.get("/attributes", response_model=list[AttributeRead])
async def list_attributes(
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[AttributeRead]:
    """List product attributes for a shop. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    attributes = await product_service.list_attributes(db, shop.shop_id)
    return [AttributeRead.model_validate(a) for a in attributes]


@router.post(
    "/attributes",
    response_model=AttributeRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_attribute(
    data: AttributeCreate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AttributeRead:
    """Create a product attribute with options. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    attribute = await product_service.create_attribute(db, shop.shop_id, data)
    return AttributeRead.model_validate(attribute)


@router.post(
    "/attributes/{attribute_id}/options",
    response_model=AttributeOptionRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_attribute_option(
    attribute_id: uuid.UUID,
    data: AttributeOptionCreate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AttributeOptionRead:
    """Add an option to an attribute. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    option = await product_service.add_attribute_option(
        db, shop.shop_id, attribute_id, data
    )
    return AttributeOptionRead.model_validate(option)
