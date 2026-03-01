"""Product service — CRUD for products, variants, media, and attributes."""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.storage import StorageBackend
from app.models.product import (
    AttributeOption,
    Category,
    Product,
    ProductAttribute,
    ProductMedia,
    ProductTag,
    ProductVariant,
    VariantAttributeOption,
)
from app.schemas.product import (
    AttributeCreate,
    AttributeOptionCreate,
    ProductCreate,
    ProductUpdate,
    VariantCreate,
    VariantUpdate,
)


# --- Product CRUD ---


async def create_product(
    db: AsyncSession, shop_id: uuid.UUID, data: ProductCreate
) -> Product:
    """Create a product with variants (variant-first architecture).

    If no variants are provided, a default variant is created automatically
    using the product's SKU and base_price.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        data: Product creation data including optional variants and tags.

    Returns:
        Created Product with variants and tags loaded.

    Raises:
        ValueError: If SKU already exists in the shop.
    """
    # Validate SKU uniqueness within shop
    existing = await db.execute(
        select(Product).where(
            Product.shop_id == shop_id,
            Product.sku == data.sku,
            Product.deleted_at.is_(None),
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError(f"SKU '{data.sku}' already exists in this shop")

    # Validate category belongs to the shop if provided
    if data.category_id:
        cat_result = await db.execute(
            select(Category).where(
                Category.category_id == data.category_id,
                Category.shop_id == shop_id,
                Category.deleted_at.is_(None),
            )
        )
        if not cat_result.scalar_one_or_none():
            raise ValueError("Category not found in this shop")

    product = Product(
        shop_id=shop_id,
        sku=data.sku,
        name=data.name,
        description=data.description,
        base_price=data.base_price,
        compare_at_price=data.compare_at_price,
        category_id=data.category_id,
        product_type=data.product_type,
        brand=data.brand,
        weight_grams=data.weight_grams,
        is_active=data.is_active,
        is_featured=data.is_featured,
    )
    db.add(product)
    await db.flush()

    # Create variants (always at least one — variant-first)
    if data.variants:
        variants = []
        for v in data.variants:
            variant = ProductVariant(
                product_id=product.product_id,
                sku=v.sku,
                variant_name=v.variant_name,
                price=v.price,
                compare_at_price=v.compare_at_price,
                stock_quantity=v.stock_quantity,
                low_stock_threshold=v.low_stock_threshold,
                track_inventory=v.track_inventory,
                weight_grams=v.weight_grams,
                is_default=v.is_default,
            )
            variants.append(variant)
        db.add_all(variants)
        await db.flush()

        # Link variant attribute options
        vao_records = []
        for v_data, variant in zip(data.variants, variants):
            for ao in v_data.attribute_options:
                vao_records.append(VariantAttributeOption(
                    variant_id=variant.variant_id,
                    option_id=ao.option_id,
                    attribute_id=ao.attribute_id,
                ))
        if vao_records:
            db.add_all(vao_records)
    else:
        # Default variant
        default_variant = ProductVariant(
            product_id=product.product_id,
            sku=data.sku,
            variant_name=None,
            price=data.base_price,
            is_default=True,
            stock_quantity=0,
        )
        db.add(default_variant)

    # Create tags
    if data.tags:
        db.add_all([
            ProductTag(product_id=product.product_id, tag_name=tag)
            for tag in data.tags
        ])

    await db.commit()

    # Reload with relationships
    return await get_product(db, shop_id, product.product_id)


async def list_products(
    db: AsyncSession,
    shop_id: uuid.UUID,
    skip: int = 0,
    limit: int = 20,
    category_id: uuid.UUID | None = None,
    search: str | None = None,
    is_active: bool | None = True,
    is_featured: bool | None = None,
    sort_by: str = "created_at",
) -> tuple[list[Product], int]:
    """List products for a shop with filters and pagination.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        skip: Offset for pagination.
        limit: Max results per page.
        category_id: Filter by category.
        search: Search by product name (ILIKE).
        is_active: Filter by active status.
        is_featured: Filter by featured flag.
        sort_by: Sort field (created_at, name, base_price, avg_rating).

    Returns:
        Tuple of (products list, total count).
    """
    base = select(Product).where(
        Product.shop_id == shop_id,
        Product.deleted_at.is_(None),
    )

    if is_active is not None:
        base = base.where(Product.is_active == is_active)
    if is_featured is not None:
        base = base.where(Product.is_featured == is_featured)
    if category_id:
        base = base.where(Product.category_id == category_id)
    if search:
        base = base.where(Product.name.ilike(f"%{search}%"))

    # Count
    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar() or 0

    # Sort
    sort_column = {
        "created_at": Product.created_at.desc(),
        "name": Product.name.asc(),
        "base_price": Product.base_price.asc(),
        "price_desc": Product.base_price.desc(),
        "avg_rating": Product.avg_rating.desc(),
        "total_sales": Product.total_sales.desc(),
    }.get(sort_by, Product.created_at.desc())

    result = await db.execute(
        base.options(
            selectinload(Product.variants),
            selectinload(Product.media),
            selectinload(Product.tags),
        )
        .order_by(sort_column)
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().unique().all()), total


async def get_product(
    db: AsyncSession, shop_id: uuid.UUID, product_id: uuid.UUID
) -> Product:
    """Get a single product with all relationships loaded.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        product_id: UUID of the product.

    Returns:
        Product with variants, media, and tags.

    Raises:
        HTTPException 404: If not found.
    """
    result = await db.execute(
        select(Product)
        .where(
            Product.product_id == product_id,
            Product.shop_id == shop_id,
            Product.deleted_at.is_(None),
        )
        .options(
            selectinload(Product.variants),
            selectinload(Product.media),
            selectinload(Product.tags),
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    return product


async def update_product(
    db: AsyncSession,
    shop_id: uuid.UUID,
    product_id: uuid.UUID,
    data: ProductUpdate,
) -> Product:
    """Update product fields.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        product_id: UUID of the product.
        data: Partial update data.

    Returns:
        Updated Product instance.
    """
    product = await get_product(db, shop_id, product_id)
    update_data = data.model_dump(exclude_unset=True)

    # Handle tags separately
    tags = update_data.pop("tags", None)

    for key, value in update_data.items():
        setattr(product, key, value)

    if tags is not None:
        # Replace all tags: delete existing, add new
        for tag in product.tags:
            await db.delete(tag)
        db.add_all([
            ProductTag(product_id=product_id, tag_name=t)
            for t in tags
        ])

    await db.commit()
    return await get_product(db, shop_id, product_id)


async def delete_product(
    db: AsyncSession,
    shop_id: uuid.UUID,
    product_id: uuid.UUID,
    deleted_by: uuid.UUID,
) -> None:
    """Soft-delete a product and its variants.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        product_id: UUID of the product.
        deleted_by: UUID of the user performing the deletion.
    """
    product = await get_product(db, shop_id, product_id)
    now = datetime.now(timezone.utc)

    product.deleted_at = now
    product.deleted_by = deleted_by

    # Soft-delete all variants
    for variant in product.variants:
        if variant.deleted_at is None:
            variant.deleted_at = now
            variant.deleted_by = deleted_by

    await db.commit()


# --- Variant CRUD ---


async def add_variant(
    db: AsyncSession, shop_id: uuid.UUID, product_id: uuid.UUID, data: VariantCreate
) -> ProductVariant:
    """Add a variant to an existing product.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        product_id: UUID of the product.
        data: Variant creation data.

    Returns:
        Created ProductVariant instance.
    """
    # Ensure product exists and belongs to shop
    await get_product(db, shop_id, product_id)

    variant = ProductVariant(
        product_id=product_id,
        sku=data.sku,
        variant_name=data.variant_name,
        price=data.price,
        compare_at_price=data.compare_at_price,
        stock_quantity=data.stock_quantity,
        low_stock_threshold=data.low_stock_threshold,
        track_inventory=data.track_inventory,
        weight_grams=data.weight_grams,
        is_default=data.is_default,
    )
    db.add(variant)
    await db.flush()

    # Link attribute options
    if data.attribute_options:
        db.add_all([
            VariantAttributeOption(
                variant_id=variant.variant_id,
                option_id=ao.option_id,
                attribute_id=ao.attribute_id,
            )
            for ao in data.attribute_options
        ])

    await db.commit()
    await db.refresh(variant)
    return variant


async def update_variant(
    db: AsyncSession,
    shop_id: uuid.UUID,
    product_id: uuid.UUID,
    variant_id: uuid.UUID,
    data: VariantUpdate,
) -> ProductVariant:
    """Update a product variant.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        product_id: UUID of the product.
        variant_id: UUID of the variant.
        data: Partial update data.

    Returns:
        Updated ProductVariant instance.
    """
    # Ensure product belongs to shop
    await get_product(db, shop_id, product_id)

    result = await db.execute(
        select(ProductVariant).where(
            ProductVariant.variant_id == variant_id,
            ProductVariant.product_id == product_id,
            ProductVariant.deleted_at.is_(None),
        )
    )
    variant = result.scalar_one_or_none()
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found"
        )

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(variant, key, value)

    await db.commit()
    await db.refresh(variant)
    return variant


async def delete_variant(
    db: AsyncSession,
    shop_id: uuid.UUID,
    product_id: uuid.UUID,
    variant_id: uuid.UUID,
    deleted_by: uuid.UUID,
) -> None:
    """Soft-delete a product variant.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        product_id: UUID of the product.
        variant_id: UUID of the variant.
        deleted_by: UUID of the user performing the deletion.
    """
    await get_product(db, shop_id, product_id)

    result = await db.execute(
        select(ProductVariant).where(
            ProductVariant.variant_id == variant_id,
            ProductVariant.product_id == product_id,
            ProductVariant.deleted_at.is_(None),
        )
    )
    variant = result.scalar_one_or_none()
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found"
        )

    variant.deleted_at = datetime.now(timezone.utc)
    variant.deleted_by = deleted_by
    await db.commit()


# --- Product Media ---


async def upload_media(
    db: AsyncSession,
    shop_id: uuid.UUID,
    product_id: uuid.UUID,
    file_bytes: bytes,
    content_type: str,
    filename: str,
    storage: StorageBackend,
    alt_text: str | None = None,
    is_primary: bool = False,
) -> ProductMedia:
    """Upload product media to storage and create a DB record.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        product_id: UUID of the product.
        file_bytes: Raw file content.
        content_type: MIME type of the file.
        filename: Original filename (used for extension).
        storage: Storage backend for file upload.
        alt_text: Alt text for accessibility.
        is_primary: Whether this is the primary image.

    Returns:
        Created ProductMedia instance.
    """
    await get_product(db, shop_id, product_id)

    # Generate storage path
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"
    path = f"{shop_id}/{product_id}/{uuid.uuid4()}.{ext}"
    file_url = await storage.upload("product-images", path, file_bytes, content_type)

    # If setting as primary, unset existing primary
    if is_primary:
        result = await db.execute(
            select(ProductMedia).where(
                ProductMedia.product_id == product_id,
                ProductMedia.is_primary.is_(True),
            )
        )
        for existing in result.scalars():
            existing.is_primary = False

    media = ProductMedia(
        product_id=product_id,
        file_url=file_url,
        media_type="image" if content_type.startswith("image") else "video",
        alt_text=alt_text,
        file_size_bytes=len(file_bytes),
        is_primary=is_primary,
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)
    return media


async def delete_media(
    db: AsyncSession,
    product_id: uuid.UUID,
    media_id: uuid.UUID,
    storage: StorageBackend,
) -> None:
    """Delete a product media record and its stored file.

    Args:
        db: Async database session.
        product_id: UUID of the product.
        media_id: UUID of the media record.
        storage: Storage backend for file deletion.
    """
    result = await db.execute(
        select(ProductMedia).where(
            ProductMedia.media_id == media_id,
            ProductMedia.product_id == product_id,
        )
    )
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Media not found"
        )

    # Extract bucket path from URL for deletion
    # URL format: .../storage/v1/object/public/product-images/{path}
    url_parts = media.file_url.split("/product-images/", 1)
    if len(url_parts) == 2:
        try:
            await storage.delete("product-images", url_parts[1])
        except Exception:
            pass  # File may already be deleted; still remove DB record

    await db.delete(media)
    await db.commit()


async def set_primary_media(
    db: AsyncSession, product_id: uuid.UUID, media_id: uuid.UUID
) -> ProductMedia:
    """Set a media item as the primary image for a product.

    Args:
        db: Async database session.
        product_id: UUID of the product.
        media_id: UUID of the media to set as primary.

    Returns:
        Updated ProductMedia instance.
    """
    # Unset existing primary
    result = await db.execute(
        select(ProductMedia).where(
            ProductMedia.product_id == product_id,
            ProductMedia.is_primary.is_(True),
        )
    )
    for existing in result.scalars():
        existing.is_primary = False

    # Set new primary
    result = await db.execute(
        select(ProductMedia).where(
            ProductMedia.media_id == media_id,
            ProductMedia.product_id == product_id,
        )
    )
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Media not found"
        )

    media.is_primary = True
    await db.commit()
    await db.refresh(media)
    return media


# --- Product Attributes ---


async def create_attribute(
    db: AsyncSession, shop_id: uuid.UUID, data: AttributeCreate
) -> ProductAttribute:
    """Create a product attribute with options.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        data: Attribute creation data with options.

    Returns:
        Created ProductAttribute with options loaded.
    """
    attribute = ProductAttribute(
        shop_id=shop_id,
        name=data.name,
        sort_order=data.sort_order,
    )
    db.add(attribute)
    await db.flush()

    if data.options:
        db.add_all([
            AttributeOption(
                attribute_id=attribute.attribute_id,
                value=opt.value,
                color_hex=opt.color_hex,
                sort_order=opt.sort_order,
            )
            for opt in data.options
        ])

    await db.commit()

    # Reload with options
    result = await db.execute(
        select(ProductAttribute)
        .where(ProductAttribute.attribute_id == attribute.attribute_id)
        .options(selectinload(ProductAttribute.options))
    )
    return result.scalar_one()


async def list_attributes(
    db: AsyncSession, shop_id: uuid.UUID
) -> list[ProductAttribute]:
    """List all product attributes for a shop.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.

    Returns:
        List of ProductAttribute instances with options.
    """
    result = await db.execute(
        select(ProductAttribute)
        .where(ProductAttribute.shop_id == shop_id)
        .options(selectinload(ProductAttribute.options))
        .order_by(ProductAttribute.sort_order)
    )
    return list(result.scalars().all())


async def add_attribute_option(
    db: AsyncSession,
    shop_id: uuid.UUID,
    attribute_id: uuid.UUID,
    data: AttributeOptionCreate,
) -> AttributeOption:
    """Add an option to an existing attribute.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        attribute_id: UUID of the attribute.
        data: Option creation data.

    Returns:
        Created AttributeOption instance.
    """
    # Verify attribute belongs to shop
    result = await db.execute(
        select(ProductAttribute).where(
            ProductAttribute.attribute_id == attribute_id,
            ProductAttribute.shop_id == shop_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Attribute not found"
        )

    option = AttributeOption(
        attribute_id=attribute_id,
        value=data.value,
        color_hex=data.color_hex,
        sort_order=data.sort_order,
    )
    db.add(option)
    await db.commit()
    await db.refresh(option)
    return option
