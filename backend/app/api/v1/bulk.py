"""Bulk import/export API routes — CSV operations for shop products."""

import uuid

from fastapi import APIRouter, Depends, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import StorageBackend
from app.db.session import get_db
from app.dependencies import get_current_shop, get_current_user, get_storage
from app.models.shop import Shop
from app.models.user import User
from app.schemas.bulk import BulkJobRead
from app.schemas.common import PaginatedResponse
from app.services import bulk_service
from app.services.shop_service import require_shop_owner_or_staff

router = APIRouter(tags=["Bulk Operations"])


@router.post(
    "/shops/{slug}/bulk/import",
    response_model=BulkJobRead,
    status_code=status.HTTP_201_CREATED,
)
async def import_products(
    file: UploadFile,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> BulkJobRead:
    """Import products from a CSV file. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)

    if not file.filename or not file.filename.lower().endswith(".csv"):
        from fastapi import HTTPException

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are accepted",
        )

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5MB limit
        from fastapi import HTTPException

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 5MB limit",
        )

    job = await bulk_service.import_products(
        db, shop.shop_id, user.user_id, content, file.filename, storage
    )
    return BulkJobRead.model_validate(job)


@router.post(
    "/shops/{slug}/bulk/export",
    response_model=BulkJobRead,
    status_code=status.HTTP_201_CREATED,
)
async def export_products(
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> BulkJobRead:
    """Export all products as a CSV file. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    job = await bulk_service.export_products(
        db, shop.shop_id, user.user_id, storage
    )
    return BulkJobRead.model_validate(job)


@router.get(
    "/shops/{slug}/bulk/jobs",
    response_model=PaginatedResponse[BulkJobRead],
)
async def list_jobs(
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[BulkJobRead]:
    """List bulk jobs for a shop. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    jobs, total = await bulk_service.list_jobs(db, shop.shop_id, skip, limit)
    return PaginatedResponse(
        items=[BulkJobRead.model_validate(j) for j in jobs],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/shops/{slug}/bulk/jobs/{job_id}",
    response_model=BulkJobRead,
)
async def get_job(
    job_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BulkJobRead:
    """Get a single bulk job by ID. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    job = await bulk_service.get_job(db, job_id, shop.shop_id)
    return BulkJobRead.model_validate(job)
