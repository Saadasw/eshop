"""Bulk service — CSV import/export and job tracking."""

import csv
import io
import uuid
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import StorageBackend
from app.models.audit import BulkJob
from app.models.enums import BulkJobStatus, BulkJobType
from app.models.product import Product, ProductVariant


# --- Job Management ---


async def list_jobs(
    db: AsyncSession,
    shop_id: uuid.UUID,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[BulkJob], int]:
    """List bulk jobs for a shop with pagination.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        skip: Offset for pagination.
        limit: Max results.

    Returns:
        Tuple of (jobs, total count).
    """
    base = select(BulkJob).where(BulkJob.shop_id == shop_id)

    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        base.order_by(BulkJob.created_at.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all()), total


async def get_job(
    db: AsyncSession,
    job_id: uuid.UUID,
    shop_id: uuid.UUID,
) -> BulkJob:
    """Get a single bulk job by ID, scoped to a shop.

    Args:
        db: Async database session.
        job_id: UUID of the job.
        shop_id: UUID of the shop.

    Returns:
        BulkJob instance.

    Raises:
        HTTPException 404: If job not found.
    """
    result = await db.execute(
        select(BulkJob).where(
            BulkJob.job_id == job_id,
            BulkJob.shop_id == shop_id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bulk job not found",
        )
    return job


# --- Product Import ---


async def import_products(
    db: AsyncSession,
    shop_id: uuid.UUID,
    user_id: uuid.UUID,
    file_content: bytes,
    file_name: str,
    storage: StorageBackend,
) -> BulkJob:
    """Import products from a CSV file.

    CSV columns: name, sku, base_price, description, stock_quantity, weight_grams, status
    Creates a product + default variant for each valid row.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        user_id: UUID of the user who initiated the import.
        file_content: Raw CSV bytes.
        file_name: Original file name.
        storage: Storage backend for persisting the uploaded file.

    Returns:
        Created BulkJob with results.
    """
    # Upload source file to storage
    storage_path = f"bulk-imports/{shop_id}/{uuid.uuid4()}/{file_name}"
    file_url = await storage.upload(
        "bulk-imports", storage_path, file_content, "text/csv"
    )

    # Create job record
    job = BulkJob(
        shop_id=shop_id,
        created_by=user_id,
        type=BulkJobType.PRODUCT_IMPORT,
        status=BulkJobStatus.PROCESSING,
        file_url=file_url,
        started_at=datetime.now(timezone.utc),
    )
    db.add(job)
    await db.flush()

    # Parse CSV
    try:
        text = file_content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = file_content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    job.total_rows = len(rows)

    errors: dict[str, str] = {}
    success_count = 0

    for i, row in enumerate(rows, start=2):  # row 1 is header
        row_key = f"row_{i}"
        try:
            name = row.get("name", "").strip()
            sku = row.get("sku", "").strip()
            price_str = row.get("base_price", "").strip()
            description = row.get("description", "").strip() or None
            stock_str = row.get("stock_quantity", "0").strip()
            weight_str = row.get("weight_grams", "").strip() or None
            product_status = row.get("status", "active").strip().lower()

            if not name:
                errors[row_key] = "Missing product name"
                continue
            if not sku:
                errors[row_key] = "Missing SKU"
                continue

            try:
                base_price = Decimal(price_str)
                if base_price < 0:
                    errors[row_key] = "Price must be non-negative"
                    continue
            except (InvalidOperation, ValueError):
                errors[row_key] = f"Invalid price: {price_str}"
                continue

            try:
                stock = int(stock_str)
            except ValueError:
                errors[row_key] = f"Invalid stock quantity: {stock_str}"
                continue

            weight = None
            if weight_str:
                try:
                    weight = int(weight_str)
                except ValueError:
                    errors[row_key] = f"Invalid weight: {weight_str}"
                    continue

            # Check SKU uniqueness within shop
            existing = await db.execute(
                select(ProductVariant.variant_id)
                .join(Product, ProductVariant.product_id == Product.product_id)
                .where(
                    Product.shop_id == shop_id,
                    ProductVariant.sku == sku,
                    Product.deleted_at.is_(None),
                    ProductVariant.deleted_at.is_(None),
                )
            )
            if existing.scalar_one_or_none():
                errors[row_key] = f"SKU '{sku}' already exists"
                continue

            is_active = product_status != "draft"

            product = Product(
                shop_id=shop_id,
                name=name,
                sku=sku,
                base_price=base_price,
                description=description,
                is_active=is_active,
            )
            db.add(product)
            await db.flush()

            variant = ProductVariant(
                product_id=product.product_id,
                sku=sku,
                price=base_price,
                is_default=True,
                stock_quantity=stock,
                weight_grams=weight,
            )
            db.add(variant)
            success_count += 1

        except Exception as e:
            errors[row_key] = str(e)

    # Finalize job
    job.success_count = success_count
    job.error_count = len(errors)
    job.error_details = errors if errors else None
    job.completed_at = datetime.now(timezone.utc)

    if job.error_count == 0:
        job.status = BulkJobStatus.COMPLETED
    elif job.success_count > 0:
        job.status = BulkJobStatus.PARTIALLY_COMPLETED
    else:
        job.status = BulkJobStatus.FAILED

    await db.commit()
    await db.refresh(job)
    return job


# --- Product Export ---


async def export_products(
    db: AsyncSession,
    shop_id: uuid.UUID,
    user_id: uuid.UUID,
    storage: StorageBackend,
) -> BulkJob:
    """Export all active products for a shop as a CSV file.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        user_id: UUID of the user who initiated the export.
        storage: Storage backend for persisting the export file.

    Returns:
        Created BulkJob with result file URL.
    """
    # Fetch products with default variants
    result = await db.execute(
        select(Product, ProductVariant)
        .join(ProductVariant, Product.product_id == ProductVariant.product_id)
        .where(
            Product.shop_id == shop_id,
            Product.deleted_at.is_(None),
            ProductVariant.deleted_at.is_(None),
            ProductVariant.is_default.is_(True),
        )
        .order_by(Product.name)
    )
    rows = result.all()

    # Build CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "name", "sku", "base_price", "description",
        "stock_quantity", "weight_grams", "status",
    ])

    for product, variant in rows:
        writer.writerow([
            product.name,
            variant.sku or product.sku,
            str(variant.price),
            product.description or "",
            variant.stock_quantity,
            variant.weight_grams or "",
            "active" if product.is_active else "draft",
        ])

    csv_bytes = output.getvalue().encode("utf-8")
    storage_path = f"bulk-exports/{shop_id}/{uuid.uuid4()}/products.csv"
    file_url = await storage.upload(
        "bulk-imports", storage_path, csv_bytes, "text/csv"
    )

    job = BulkJob(
        shop_id=shop_id,
        created_by=user_id,
        type=BulkJobType.PRODUCT_EXPORT,
        status=BulkJobStatus.COMPLETED,
        file_url=file_url,
        result_file_url=file_url,
        total_rows=len(rows),
        success_count=len(rows),
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job
