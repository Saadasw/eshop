"""Review API routes — create, list, reply, delete."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_shop, get_current_user
from app.models.shop import Shop
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.review import ReviewCreate, ReviewRead, ReviewReply
from app.services import review_service
from app.services.shop_service import require_shop_owner_or_staff

router = APIRouter(tags=["Reviews"])


# --- Customer: create review ---


@router.post(
    "/shops/{slug}/products/{product_id}/reviews",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_review(
    product_id: uuid.UUID,
    data: ReviewCreate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewRead:
    """Create a review for a product. Must have a delivered order containing this product."""
    review = await review_service.create_review(
        db, shop.shop_id, product_id, user.user_id, data
    )
    customer_name = user.full_name if not data.is_anonymous else None
    result = ReviewRead.model_validate(review)
    result.customer_name = customer_name
    return result


# --- Public: list reviews for a product ---


@router.get(
    "/shops/{slug}/products/{product_id}/reviews",
    response_model=PaginatedResponse[ReviewRead],
)
async def list_product_reviews(
    product_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ReviewRead]:
    """List visible reviews for a product. Public endpoint."""
    review_dicts, total = await review_service.list_product_reviews(
        db, shop.shop_id, product_id, skip, limit
    )
    return PaginatedResponse(
        items=[ReviewRead(**r) for r in review_dicts],
        total=total,
        skip=skip,
        limit=limit,
    )


# --- Shop owner/staff: reply to review ---


@router.post(
    "/shops/{slug}/reviews/{review_id}/reply",
    response_model=ReviewRead,
)
async def reply_to_review(
    review_id: uuid.UUID,
    data: ReviewReply,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewRead:
    """Reply to a review. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    review = await review_service.reply_to_review(
        db, review_id, shop.shop_id, data.shop_reply
    )
    return ReviewRead.model_validate(review)


# --- Shop owner/staff: delete review ---


@router.delete(
    "/shops/{slug}/reviews/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_review(
    review_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Soft-delete a review. Owner or staff only."""
    await require_shop_owner_or_staff(user, shop, db)
    await review_service.delete_review(db, review_id, shop.shop_id, user.user_id)
