"""Shop API routes — CRUD, config, addresses, staff, delivery zones, payment methods, followers."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_shop, get_current_user
from app.models.enums import ShopStatus
from app.models.shop import Shop
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.shop import (
    DeliveryZoneCreate,
    DeliveryZoneRead,
    DeliveryZoneUpdate,
    FollowerRead,
    ShopAddressCreate,
    ShopAddressRead,
    ShopAddressUpdate,
    ShopConfigRead,
    ShopConfigUpdate,
    ShopCreate,
    ShopPaymentMethodCreate,
    ShopPaymentMethodRead,
    ShopPaymentMethodUpdate,
    ShopRead,
    ShopUpdate,
    StaffCreate,
    StaffRead,
    StaffUpdate,
)
from app.services import shop_service

router = APIRouter(prefix="/shops", tags=["Shops"])


# --- Shop CRUD ---


@router.post("", response_model=ShopRead, status_code=status.HTTP_201_CREATED)
async def create_shop(
    data: ShopCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ShopRead:
    """Create a new shop. Requires authentication."""
    try:
        shop = await shop_service.create_shop(db, user.user_id, data)
        return ShopRead.model_validate(shop)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=PaginatedResponse[ShopRead])
async def list_shops(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ShopRead]:
    """List active shops (public)."""
    shops, total = await shop_service.list_shops(db, skip, limit)
    return PaginatedResponse(
        items=[ShopRead.model_validate(s) for s in shops],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{slug}", response_model=ShopRead)
async def get_shop(
    shop: Shop = Depends(get_current_shop),
) -> ShopRead:
    """Get shop detail by slug (public)."""
    return ShopRead.model_validate(shop)


@router.patch("/{slug}", response_model=ShopRead)
async def update_shop(
    data: ShopUpdate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ShopRead:
    """Update shop details. Owner only."""
    shop_service.require_shop_owner(user, shop)
    updated = await shop_service.update_shop(db, shop, data)
    return ShopRead.model_validate(updated)


# --- Shop Config ---


@router.get("/{slug}/settings", response_model=ShopConfigRead)
async def get_settings(
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ShopConfigRead:
    """Get shop configuration. Owner or staff only."""
    await shop_service.require_shop_owner_or_staff(user, shop, db)
    config = await shop_service.get_config(db, shop.shop_id)
    return ShopConfigRead.model_validate(config)


@router.patch("/{slug}/settings", response_model=ShopConfigRead)
async def update_settings(
    data: ShopConfigUpdate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ShopConfigRead:
    """Update shop configuration. Owner only."""
    shop_service.require_shop_owner(user, shop)
    config = await shop_service.update_config(db, shop.shop_id, data)
    return ShopConfigRead.model_validate(config)


# --- Shop Addresses ---


@router.post(
    "/{slug}/addresses",
    response_model=ShopAddressRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_address(
    data: ShopAddressCreate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ShopAddressRead:
    """Add an address to a shop. Owner only."""
    shop_service.require_shop_owner(user, shop)
    address = await shop_service.add_address(db, shop.shop_id, data)
    return ShopAddressRead.model_validate(address)


@router.patch("/{slug}/addresses/{address_id}", response_model=ShopAddressRead)
async def update_address(
    address_id: uuid.UUID,
    data: ShopAddressUpdate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ShopAddressRead:
    """Update a shop address. Owner only."""
    shop_service.require_shop_owner(user, shop)
    address = await shop_service.update_address(db, shop.shop_id, address_id, data)
    return ShopAddressRead.model_validate(address)


@router.delete(
    "/{slug}/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_address(
    address_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a shop address. Owner only."""
    shop_service.require_shop_owner(user, shop)
    await shop_service.delete_address(db, shop.shop_id, address_id)


# --- Staff ---


@router.post(
    "/{slug}/staff",
    response_model=StaffRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_staff(
    data: StaffCreate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StaffRead:
    """Add a staff member. Owner only."""
    shop_service.require_shop_owner(user, shop)
    try:
        staff = await shop_service.add_staff(db, shop.shop_id, data)
        return StaffRead.model_validate(staff)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{slug}/staff/{staff_id}", response_model=StaffRead)
async def update_staff(
    staff_id: uuid.UUID,
    data: StaffUpdate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StaffRead:
    """Update a staff member. Owner only."""
    shop_service.require_shop_owner(user, shop)
    staff = await shop_service.update_staff(db, shop.shop_id, staff_id, data)
    return StaffRead.model_validate(staff)


@router.delete("/{slug}/staff/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_staff(
    staff_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Remove a staff member (soft delete). Owner only."""
    shop_service.require_shop_owner(user, shop)
    await shop_service.remove_staff(db, shop.shop_id, staff_id, user.user_id)


# --- Delivery Zones ---


@router.post(
    "/{slug}/delivery-zones",
    response_model=DeliveryZoneRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_delivery_zone(
    data: DeliveryZoneCreate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DeliveryZoneRead:
    """Create a delivery zone. Owner only."""
    shop_service.require_shop_owner(user, shop)
    zone = await shop_service.add_delivery_zone(db, shop.shop_id, data)
    return DeliveryZoneRead.model_validate(zone)


@router.patch("/{slug}/delivery-zones/{zone_id}", response_model=DeliveryZoneRead)
async def update_delivery_zone(
    zone_id: uuid.UUID,
    data: DeliveryZoneUpdate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DeliveryZoneRead:
    """Update a delivery zone. Owner only."""
    shop_service.require_shop_owner(user, shop)
    zone = await shop_service.update_delivery_zone(db, shop.shop_id, zone_id, data)
    return DeliveryZoneRead.model_validate(zone)


@router.delete(
    "/{slug}/delivery-zones/{zone_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_delivery_zone(
    zone_id: uuid.UUID,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a delivery zone. Owner only."""
    shop_service.require_shop_owner(user, shop)
    await shop_service.delete_delivery_zone(db, shop.shop_id, zone_id)


# --- Payment Methods ---


@router.post(
    "/{slug}/payment-methods",
    response_model=ShopPaymentMethodRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_payment_method(
    data: ShopPaymentMethodCreate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ShopPaymentMethodRead:
    """Configure a payment method. Owner only."""
    shop_service.require_shop_owner(user, shop)
    try:
        pm = await shop_service.configure_payment_method(db, shop.shop_id, data)
        return ShopPaymentMethodRead.model_validate(pm)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch(
    "/{slug}/payment-methods/{spm_id}", response_model=ShopPaymentMethodRead
)
async def update_payment_method(
    spm_id: uuid.UUID,
    data: ShopPaymentMethodUpdate,
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ShopPaymentMethodRead:
    """Update a payment method. Owner only."""
    shop_service.require_shop_owner(user, shop)
    pm = await shop_service.update_payment_method(db, shop.shop_id, spm_id, data)
    return ShopPaymentMethodRead.model_validate(pm)


# --- Follow / Unfollow ---


@router.post(
    "/{slug}/follow",
    response_model=FollowerRead,
    status_code=status.HTTP_201_CREATED,
)
async def follow_shop(
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FollowerRead:
    """Follow a shop. Requires authentication."""
    try:
        follower = await shop_service.follow_shop(db, shop.shop_id, user.user_id)
        return FollowerRead.model_validate(follower)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{slug}/follow", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow_shop(
    shop: Shop = Depends(get_current_shop),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Unfollow a shop. Requires authentication."""
    await shop_service.unfollow_shop(db, shop.shop_id, user.user_id)
