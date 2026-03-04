"""Shop service — CRUD, config, addresses, staff, delivery zones, payment methods, followers."""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import ShopStatus, UserRole
from app.models.shop import (
    DeliveryZone,
    Shop,
    ShopAddress,
    ShopConfig,
    ShopFollower,
    ShopPaymentMethod,
    ShopStaff,
)
from app.models.user import User
from app.schemas.shop import (
    DeliveryZoneCreate,
    DeliveryZoneUpdate,
    ShopAddressCreate,
    ShopAddressUpdate,
    ShopConfigUpdate,
    ShopCreate,
    ShopPaymentMethodCreate,
    ShopPaymentMethodUpdate,
    ShopUpdate,
    StaffCreate,
    StaffUpdate,
)


# --- Authorization helpers ---


def require_shop_owner(user: User, shop: Shop) -> None:
    """Raise 403 if the user is not the shop owner.

    Args:
        user: Authenticated user.
        shop: Target shop.
    """
    if shop.owner_id != user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the shop owner can perform this action",
        )


async def require_shop_owner_or_staff(
    user: User, shop: Shop, db: AsyncSession
) -> None:
    """Raise 403 if the user is neither the shop owner nor an active staff member.

    Args:
        user: Authenticated user.
        shop: Target shop.
        db: Async database session.
    """
    if shop.owner_id == user.user_id:
        return

    result = await db.execute(
        select(ShopStaff).where(
            ShopStaff.shop_id == shop.shop_id,
            ShopStaff.user_id == user.user_id,
            ShopStaff.is_active.is_(True),
            ShopStaff.deleted_at.is_(None),
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for this shop",
        )


# --- Shop CRUD ---


async def create_shop(
    db: AsyncSession, owner_id: uuid.UUID, data: ShopCreate
) -> Shop:
    """Create a new shop with default config.

    Args:
        db: Async database session.
        owner_id: UUID of the shop owner.
        data: Shop creation data.

    Returns:
        The created Shop instance.

    Raises:
        ValueError: If the slug is already taken.
    """
    # Check slug uniqueness
    existing = await db.execute(
        select(Shop).where(Shop.slug == data.slug)
    )
    if existing.scalar_one_or_none():
        raise ValueError(f"Slug '{data.slug}' is already taken")

    shop = Shop(
        owner_id=owner_id,
        slug=data.slug,
        shop_name=data.shop_name,
        description=data.description,
        contact_email=data.contact_email,
        contact_phone=data.contact_phone,
        trade_license_no=data.trade_license_no,
        nid_number=data.nid_number,
        status=ShopStatus.PENDING,
    )
    db.add(shop)
    await db.flush()

    # Auto-create default config
    config = ShopConfig(shop_id=shop.shop_id)
    db.add(config)

    # Upgrade user role to owner if they're currently a customer
    result = await db.execute(select(User).where(User.user_id == owner_id))
    user = result.scalar_one()
    if user.primary_role == UserRole.CUSTOMER:
        user.primary_role = UserRole.OWNER

    await db.commit()
    await db.refresh(shop)
    return shop


async def list_shops(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    status_filter: ShopStatus | None = ShopStatus.ACTIVE,
    owner_id: uuid.UUID | None = None,
) -> tuple[list[Shop], int]:
    """List shops with optional status filter, owner filter, and pagination.

    Args:
        db: Async database session.
        skip: Offset for pagination.
        limit: Max results per page.
        status_filter: Filter by shop status (default: active only).
        owner_id: Filter by shop owner (optional).

    Returns:
        Tuple of (shops list, total count).
    """
    base = select(Shop).where(Shop.deleted_at.is_(None))
    if status_filter:
        base = base.where(Shop.status == status_filter)
    if owner_id:
        base = base.where(Shop.owner_id == owner_id)

    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        base.order_by(Shop.created_at.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all()), total


async def get_shop_detail(db: AsyncSession, slug: str) -> Shop:
    """Get a shop by slug with eager-loaded config and addresses.

    Args:
        db: Async database session.
        slug: Shop URL slug.

    Returns:
        Shop with config and addresses loaded.

    Raises:
        HTTPException 404: If shop not found.
    """
    result = await db.execute(
        select(Shop)
        .where(Shop.slug == slug, Shop.deleted_at.is_(None))
        .options(selectinload(Shop.config), selectinload(Shop.addresses))
    )
    shop = result.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")
    return shop


async def update_shop(
    db: AsyncSession, shop: Shop, data: ShopUpdate
) -> Shop:
    """Update shop fields.

    Args:
        db: Async database session.
        shop: Shop to update.
        data: Partial update data.

    Returns:
        Updated Shop instance.
    """
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(shop, key, value)
    await db.commit()
    await db.refresh(shop)
    return shop


# --- Shop Config ---


async def get_config(db: AsyncSession, shop_id: uuid.UUID) -> ShopConfig:
    """Get shop config by shop_id.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.

    Returns:
        ShopConfig instance.

    Raises:
        HTTPException 404: If config not found.
    """
    result = await db.execute(
        select(ShopConfig).where(ShopConfig.shop_id == shop_id)
    )
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop config not found")
    return config


async def update_config(
    db: AsyncSession, shop_id: uuid.UUID, data: ShopConfigUpdate
) -> ShopConfig:
    """Update shop configuration.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        data: Partial config update.

    Returns:
        Updated ShopConfig instance.
    """
    config = await get_config(db, shop_id)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(config, key, value)
    await db.commit()
    await db.refresh(config)
    return config


# --- Shop Address ---


async def list_addresses(
    db: AsyncSession, shop_id: uuid.UUID
) -> list[ShopAddress]:
    """List all addresses for a shop.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.

    Returns:
        List of shop addresses.
    """
    result = await db.execute(
        select(ShopAddress).where(ShopAddress.shop_id == shop_id)
    )
    return list(result.scalars().all())


async def add_address(
    db: AsyncSession, shop_id: uuid.UUID, data: ShopAddressCreate
) -> ShopAddress:
    """Add an address to a shop.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        data: Address creation data.

    Returns:
        Created ShopAddress instance.
    """
    address = ShopAddress(shop_id=shop_id, **data.model_dump())
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return address


async def update_address(
    db: AsyncSession, shop_id: uuid.UUID, address_id: uuid.UUID, data: ShopAddressUpdate
) -> ShopAddress:
    """Update a shop address.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        address_id: UUID of the address.
        data: Partial update data.

    Returns:
        Updated ShopAddress instance.
    """
    result = await db.execute(
        select(ShopAddress).where(
            ShopAddress.address_id == address_id,
            ShopAddress.shop_id == shop_id,
        )
    )
    address = result.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(address, key, value)
    await db.commit()
    await db.refresh(address)
    return address


async def delete_address(
    db: AsyncSession, shop_id: uuid.UUID, address_id: uuid.UUID
) -> None:
    """Delete a shop address (hard delete).

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        address_id: UUID of the address.
    """
    result = await db.execute(
        select(ShopAddress).where(
            ShopAddress.address_id == address_id,
            ShopAddress.shop_id == shop_id,
        )
    )
    address = result.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    await db.delete(address)
    await db.commit()


# --- Staff ---


async def list_staff(
    db: AsyncSession, shop_id: uuid.UUID
) -> list[ShopStaff]:
    """List active staff members for a shop.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.

    Returns:
        List of active (non-deleted) staff members.
    """
    result = await db.execute(
        select(ShopStaff).where(
            ShopStaff.shop_id == shop_id,
            ShopStaff.deleted_at.is_(None),
        )
    )
    return list(result.scalars().all())


async def add_staff(
    db: AsyncSession, shop_id: uuid.UUID, data: StaffCreate
) -> ShopStaff:
    """Add a staff member to a shop.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        data: Staff creation data.

    Returns:
        Created ShopStaff instance.

    Raises:
        ValueError: If user not found or already staff.
    """
    # Verify user exists
    user_result = await db.execute(
        select(User).where(User.user_id == data.user_id, User.deleted_at.is_(None))
    )
    if not user_result.scalar_one_or_none():
        raise ValueError("User not found")

    # Check for existing active staff record (unique index: shop_id+user_id where deleted_at IS NULL)
    existing = await db.execute(
        select(ShopStaff).where(
            ShopStaff.shop_id == shop_id,
            ShopStaff.user_id == data.user_id,
            ShopStaff.deleted_at.is_(None),
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError("User is already a staff member of this shop")

    staff = ShopStaff(
        shop_id=shop_id,
        user_id=data.user_id,
        role=data.role,
        permissions=data.permissions,
    )
    db.add(staff)
    await db.commit()
    await db.refresh(staff)
    return staff


async def update_staff(
    db: AsyncSession, shop_id: uuid.UUID, staff_id: uuid.UUID, data: StaffUpdate
) -> ShopStaff:
    """Update a staff member.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        staff_id: UUID of the staff record.
        data: Partial update data.

    Returns:
        Updated ShopStaff instance.
    """
    result = await db.execute(
        select(ShopStaff).where(
            ShopStaff.staff_id == staff_id,
            ShopStaff.shop_id == shop_id,
            ShopStaff.deleted_at.is_(None),
        )
    )
    staff = result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(staff, key, value)
    await db.commit()
    await db.refresh(staff)
    return staff


async def remove_staff(
    db: AsyncSession, shop_id: uuid.UUID, staff_id: uuid.UUID, deleted_by: uuid.UUID
) -> None:
    """Soft-delete a staff member.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        staff_id: UUID of the staff record.
        deleted_by: UUID of the user performing the deletion.
    """
    result = await db.execute(
        select(ShopStaff).where(
            ShopStaff.staff_id == staff_id,
            ShopStaff.shop_id == shop_id,
            ShopStaff.deleted_at.is_(None),
        )
    )
    staff = result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff not found")

    staff.deleted_at = datetime.now(timezone.utc)
    staff.deleted_by = deleted_by
    await db.commit()


# --- Delivery Zone ---


async def list_delivery_zones(
    db: AsyncSession, shop_id: uuid.UUID
) -> list[DeliveryZone]:
    """List all delivery zones for a shop.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.

    Returns:
        List of delivery zones ordered by sort_order.
    """
    result = await db.execute(
        select(DeliveryZone)
        .where(DeliveryZone.shop_id == shop_id)
        .order_by(DeliveryZone.sort_order)
    )
    return list(result.scalars().all())


async def add_delivery_zone(
    db: AsyncSession, shop_id: uuid.UUID, data: DeliveryZoneCreate
) -> DeliveryZone:
    """Create a delivery zone for a shop.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        data: Zone creation data.

    Returns:
        Created DeliveryZone instance.
    """
    zone = DeliveryZone(shop_id=shop_id, **data.model_dump())
    db.add(zone)
    await db.commit()
    await db.refresh(zone)
    return zone


async def update_delivery_zone(
    db: AsyncSession, shop_id: uuid.UUID, zone_id: uuid.UUID, data: DeliveryZoneUpdate
) -> DeliveryZone:
    """Update a delivery zone.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        zone_id: UUID of the zone.
        data: Partial update data.

    Returns:
        Updated DeliveryZone instance.
    """
    result = await db.execute(
        select(DeliveryZone).where(
            DeliveryZone.zone_id == zone_id,
            DeliveryZone.shop_id == shop_id,
        )
    )
    zone = result.scalar_one_or_none()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery zone not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(zone, key, value)
    await db.commit()
    await db.refresh(zone)
    return zone


async def delete_delivery_zone(
    db: AsyncSession, shop_id: uuid.UUID, zone_id: uuid.UUID
) -> None:
    """Delete a delivery zone (hard delete).

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        zone_id: UUID of the zone.
    """
    result = await db.execute(
        select(DeliveryZone).where(
            DeliveryZone.zone_id == zone_id,
            DeliveryZone.shop_id == shop_id,
        )
    )
    zone = result.scalar_one_or_none()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery zone not found")
    await db.delete(zone)
    await db.commit()


# --- Payment Method ---


async def list_payment_methods(
    db: AsyncSession, shop_id: uuid.UUID
) -> list[ShopPaymentMethod]:
    """List all payment methods for a shop.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.

    Returns:
        List of payment methods ordered by sort_order.
    """
    result = await db.execute(
        select(ShopPaymentMethod)
        .where(ShopPaymentMethod.shop_id == shop_id)
        .order_by(ShopPaymentMethod.sort_order)
    )
    return list(result.scalars().all())


async def configure_payment_method(
    db: AsyncSession, shop_id: uuid.UUID, data: ShopPaymentMethodCreate
) -> ShopPaymentMethod:
    """Add or configure a payment method for a shop.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        data: Payment method configuration.

    Returns:
        Created ShopPaymentMethod instance.

    Raises:
        ValueError: If the method is already configured for this shop.
    """
    existing = await db.execute(
        select(ShopPaymentMethod).where(
            ShopPaymentMethod.shop_id == shop_id,
            ShopPaymentMethod.method == data.method,
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError(f"Payment method '{data.method.value}' is already configured")

    pm = ShopPaymentMethod(shop_id=shop_id, **data.model_dump())
    db.add(pm)
    await db.commit()
    await db.refresh(pm)
    return pm


async def update_payment_method(
    db: AsyncSession, shop_id: uuid.UUID, spm_id: uuid.UUID, data: ShopPaymentMethodUpdate
) -> ShopPaymentMethod:
    """Update a payment method configuration.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        spm_id: UUID of the payment method config.
        data: Partial update data.

    Returns:
        Updated ShopPaymentMethod instance.
    """
    result = await db.execute(
        select(ShopPaymentMethod).where(
            ShopPaymentMethod.spm_id == spm_id,
            ShopPaymentMethod.shop_id == shop_id,
        )
    )
    pm = result.scalar_one_or_none()
    if not pm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Payment method not found"
        )

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(pm, key, value)
    await db.commit()
    await db.refresh(pm)
    return pm


# --- Follow / Unfollow ---


async def follow_shop(
    db: AsyncSession, shop_id: uuid.UUID, user_id: uuid.UUID
) -> ShopFollower:
    """Follow a shop.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        user_id: UUID of the follower.

    Returns:
        Created ShopFollower instance.

    Raises:
        ValueError: If already following.
    """
    existing = await db.execute(
        select(ShopFollower).where(
            ShopFollower.shop_id == shop_id,
            ShopFollower.user_id == user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError("Already following this shop")

    follower = ShopFollower(shop_id=shop_id, user_id=user_id)
    db.add(follower)
    await db.commit()
    await db.refresh(follower)
    return follower


async def unfollow_shop(
    db: AsyncSession, shop_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    """Unfollow a shop.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        user_id: UUID of the follower.
    """
    result = await db.execute(
        select(ShopFollower).where(
            ShopFollower.shop_id == shop_id,
            ShopFollower.user_id == user_id,
        )
    )
    follower = result.scalar_one_or_none()
    if not follower:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not following this shop")
    await db.delete(follower)
    await db.commit()
