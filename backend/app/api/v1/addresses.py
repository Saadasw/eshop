"""Customer address API routes — CRUD."""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.address import (
    CustomerAddressCreate,
    CustomerAddressRead,
    CustomerAddressUpdate,
)
from app.services import address_service

router = APIRouter(tags=["Addresses"])


@router.post(
    "/addresses",
    response_model=CustomerAddressRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_address(
    data: CustomerAddressCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CustomerAddressRead:
    """Create a new delivery address for the current user."""
    address = await address_service.create_address(db, user.user_id, data)
    return CustomerAddressRead.model_validate(address)


@router.get(
    "/addresses",
    response_model=list[CustomerAddressRead],
)
async def list_addresses(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CustomerAddressRead]:
    """List all addresses for the current user."""
    addresses = await address_service.list_addresses(db, user.user_id)
    return [CustomerAddressRead.model_validate(a) for a in addresses]


@router.get(
    "/addresses/{address_id}",
    response_model=CustomerAddressRead,
)
async def get_address(
    address_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CustomerAddressRead:
    """Get a single address by ID."""
    address = await address_service.get_address(db, address_id, user.user_id)
    return CustomerAddressRead.model_validate(address)


@router.patch(
    "/addresses/{address_id}",
    response_model=CustomerAddressRead,
)
async def update_address(
    address_id: uuid.UUID,
    data: CustomerAddressUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CustomerAddressRead:
    """Update an address."""
    address = await address_service.update_address(db, address_id, user.user_id, data)
    return CustomerAddressRead.model_validate(address)


@router.delete(
    "/addresses/{address_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_address(
    address_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Soft-delete an address."""
    await address_service.delete_address(db, address_id, user.user_id)
