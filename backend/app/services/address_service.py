"""Customer address service — CRUD with default management."""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cart import CustomerAddress
from app.schemas.address import CustomerAddressCreate, CustomerAddressUpdate


async def create_address(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: CustomerAddressCreate,
) -> CustomerAddress:
    """Create a new customer address.

    If is_default is True, unsets any existing default address for the user.

    Args:
        db: Async database session.
        user_id: UUID of the authenticated user.
        data: Address creation data.

    Returns:
        Created CustomerAddress.
    """
    if data.is_default:
        await _unset_defaults(db, user_id)

    address = CustomerAddress(
        user_id=user_id,
        **data.model_dump(),
    )
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return address


async def list_addresses(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> list[CustomerAddress]:
    """List all non-deleted addresses for a user, default first.

    Args:
        db: Async database session.
        user_id: UUID of the authenticated user.

    Returns:
        List of CustomerAddress records.
    """
    result = await db.execute(
        select(CustomerAddress)
        .where(
            CustomerAddress.user_id == user_id,
            CustomerAddress.deleted_at.is_(None),
        )
        .order_by(CustomerAddress.is_default.desc(), CustomerAddress.created_at.desc())
    )
    return list(result.scalars().all())


async def get_address(
    db: AsyncSession,
    address_id: uuid.UUID,
    user_id: uuid.UUID,
) -> CustomerAddress:
    """Get a single address by ID, owned by user.

    Args:
        db: Async database session.
        address_id: UUID of the address.
        user_id: UUID of the authenticated user.

    Returns:
        CustomerAddress instance.

    Raises:
        HTTPException 404: If address not found or not owned by user.
    """
    result = await db.execute(
        select(CustomerAddress).where(
            CustomerAddress.address_id == address_id,
            CustomerAddress.user_id == user_id,
            CustomerAddress.deleted_at.is_(None),
        )
    )
    address = result.scalar_one_or_none()
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found",
        )
    return address


async def update_address(
    db: AsyncSession,
    address_id: uuid.UUID,
    user_id: uuid.UUID,
    data: CustomerAddressUpdate,
) -> CustomerAddress:
    """Update a customer address.

    If is_default is set to True, unsets any existing default address for the user.

    Args:
        db: Async database session.
        address_id: UUID of the address.
        user_id: UUID of the authenticated user.
        data: Fields to update.

    Returns:
        Updated CustomerAddress.
    """
    address = await get_address(db, address_id, user_id)

    update_data = data.model_dump(exclude_unset=True)

    if update_data.get("is_default"):
        await _unset_defaults(db, user_id)

    for field, value in update_data.items():
        setattr(address, field, value)

    await db.commit()
    await db.refresh(address)
    return address


async def delete_address(
    db: AsyncSession,
    address_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    """Soft-delete a customer address.

    Args:
        db: Async database session.
        address_id: UUID of the address.
        user_id: UUID of the authenticated user.
    """
    address = await get_address(db, address_id, user_id)
    address.deleted_at = datetime.now(timezone.utc)
    await db.commit()


async def _unset_defaults(db: AsyncSession, user_id: uuid.UUID) -> None:
    """Unset is_default on all addresses for a user.

    Args:
        db: Async database session.
        user_id: UUID of the user.
    """
    await db.execute(
        update(CustomerAddress)
        .where(
            CustomerAddress.user_id == user_id,
            CustomerAddress.is_default.is_(True),
            CustomerAddress.deleted_at.is_(None),
        )
        .values(is_default=False)
    )
