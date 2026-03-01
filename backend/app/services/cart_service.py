"""Cart service — add/remove items, stock validation, guest merge."""

import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import Cart, CartItem
from app.models.product import Product, ProductMedia, ProductVariant
from app.schemas.cart import CartItemRead, CartRead


async def get_or_create_cart(
    db: AsyncSession, shop_id: uuid.UUID, user_id: uuid.UUID
) -> Cart:
    """Get the user's cart for a shop, or create one if it doesn't exist.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        user_id: UUID of the authenticated user.

    Returns:
        Cart instance with items loaded.
    """
    result = await db.execute(
        select(Cart)
        .where(Cart.shop_id == shop_id, Cart.user_id == user_id)
        .options(selectinload(Cart.items))
    )
    cart = result.scalar_one_or_none()

    if not cart:
        cart = Cart(shop_id=shop_id, user_id=user_id)
        db.add(cart)
        await db.flush()
        cart.items = []

    return cart


async def get_cart_read(
    db: AsyncSession, shop_id: uuid.UUID, user_id: uuid.UUID
) -> CartRead:
    """Get the user's cart with enriched item details for display.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        user_id: UUID of the authenticated user.

    Returns:
        CartRead with denormalized variant/product info, subtotal, and item count.
    """
    cart = await get_or_create_cart(db, shop_id, user_id)
    items: list[CartItemRead] = []
    subtotal = Decimal("0")

    for ci in cart.items:
        # Load variant with product
        v_result = await db.execute(
            select(ProductVariant)
            .where(ProductVariant.variant_id == ci.variant_id)
            .options(selectinload(ProductVariant.product))
        )
        variant = v_result.scalar_one_or_none()

        # Get primary image
        image_url = None
        if variant:
            media_result = await db.execute(
                select(ProductMedia.file_url).where(
                    ProductMedia.product_id == variant.product_id,
                    ProductMedia.is_primary.is_(True),
                )
            )
            image_url = media_result.scalar_one_or_none()

        line_total = (variant.price * ci.quantity) if variant else Decimal("0")
        subtotal += line_total

        items.append(CartItemRead(
            cart_item_id=ci.cart_item_id,
            variant_id=ci.variant_id,
            quantity=ci.quantity,
            variant_name=variant.variant_name if variant else None,
            product_name=variant.product.name if variant and variant.product else None,
            sku=variant.sku if variant else None,
            unit_price=variant.price if variant else None,
            image_url=image_url,
            stock_quantity=variant.stock_quantity if variant else None,
        ))

    return CartRead(
        cart_id=cart.cart_id,
        shop_id=cart.shop_id,
        user_id=cart.user_id,
        items=items,
        item_count=sum(i.quantity for i in items),
        subtotal=subtotal,
    )


async def add_item(
    db: AsyncSession,
    shop_id: uuid.UUID,
    user_id: uuid.UUID,
    variant_id: uuid.UUID,
    quantity: int,
) -> CartRead:
    """Add an item to the cart or increment quantity if already present.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        user_id: UUID of the authenticated user.
        variant_id: UUID of the product variant to add.
        quantity: Number of units to add.

    Returns:
        Updated CartRead.

    Raises:
        HTTPException 400: If variant not found, inactive, or insufficient stock.
    """
    # Validate variant exists, is active, and belongs to shop
    variant = await _validate_variant(db, shop_id, variant_id)

    # Check stock
    cart = await get_or_create_cart(db, shop_id, user_id)

    # Check if variant already in cart
    existing_item = next(
        (i for i in cart.items if i.variant_id == variant_id), None
    )
    new_qty = (existing_item.quantity + quantity) if existing_item else quantity

    if variant.track_inventory and new_qty > variant.stock_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {variant.stock_quantity}",
        )

    if existing_item:
        existing_item.quantity = new_qty
    else:
        item = CartItem(
            cart_id=cart.cart_id,
            variant_id=variant_id,
            quantity=quantity,
        )
        db.add(item)

    await db.commit()
    return await get_cart_read(db, shop_id, user_id)


async def update_item_quantity(
    db: AsyncSession,
    shop_id: uuid.UUID,
    user_id: uuid.UUID,
    cart_item_id: uuid.UUID,
    quantity: int,
) -> CartRead:
    """Update the quantity of a cart item.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        user_id: UUID of the authenticated user.
        cart_item_id: UUID of the cart item.
        quantity: New quantity (must be > 0).

    Returns:
        Updated CartRead.

    Raises:
        HTTPException 404: If cart item not found.
        HTTPException 400: If insufficient stock.
    """
    cart = await get_or_create_cart(db, shop_id, user_id)
    item = next((i for i in cart.items if i.cart_item_id == cart_item_id), None)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found"
        )

    # Check stock
    v_result = await db.execute(
        select(ProductVariant).where(ProductVariant.variant_id == item.variant_id)
    )
    variant = v_result.scalar_one()
    if variant.track_inventory and quantity > variant.stock_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {variant.stock_quantity}",
        )

    item.quantity = quantity
    await db.commit()
    return await get_cart_read(db, shop_id, user_id)


async def remove_item(
    db: AsyncSession,
    shop_id: uuid.UUID,
    user_id: uuid.UUID,
    cart_item_id: uuid.UUID,
) -> CartRead:
    """Remove an item from the cart.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        user_id: UUID of the authenticated user.
        cart_item_id: UUID of the cart item.

    Returns:
        Updated CartRead.

    Raises:
        HTTPException 404: If cart item not found.
    """
    cart = await get_or_create_cart(db, shop_id, user_id)
    item = next((i for i in cart.items if i.cart_item_id == cart_item_id), None)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found"
        )

    await db.delete(item)
    await db.commit()
    return await get_cart_read(db, shop_id, user_id)


async def clear_cart(
    db: AsyncSession, shop_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    """Remove all items from the user's cart for a shop.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        user_id: UUID of the authenticated user.
    """
    cart = await get_or_create_cart(db, shop_id, user_id)
    for item in cart.items:
        await db.delete(item)
    await db.commit()


async def merge_guest_cart(
    db: AsyncSession,
    shop_id: uuid.UUID,
    user_id: uuid.UUID,
    session_id: str,
) -> CartRead:
    """Merge a guest (session-based) cart into the authenticated user's cart.

    Items from the guest cart are added to the user cart. If the same variant
    exists in both, the quantity from the guest cart is used (latest intent).

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        user_id: UUID of the authenticated user.
        session_id: Guest session identifier.

    Returns:
        Merged CartRead.
    """
    # Find guest cart
    result = await db.execute(
        select(Cart)
        .where(
            Cart.shop_id == shop_id,
            Cart.session_id == session_id,
            Cart.user_id.is_(None),
        )
        .options(selectinload(Cart.items))
    )
    guest_cart = result.scalar_one_or_none()
    if not guest_cart or not guest_cart.items:
        return await get_cart_read(db, shop_id, user_id)

    user_cart = await get_or_create_cart(db, shop_id, user_id)
    existing_variants = {i.variant_id: i for i in user_cart.items}

    for guest_item in guest_cart.items:
        if guest_item.variant_id in existing_variants:
            # Use guest quantity (latest intent)
            existing_variants[guest_item.variant_id].quantity = guest_item.quantity
        else:
            # Move item to user cart
            new_item = CartItem(
                cart_id=user_cart.cart_id,
                variant_id=guest_item.variant_id,
                quantity=guest_item.quantity,
            )
            db.add(new_item)

    # Delete guest cart
    await db.delete(guest_cart)
    await db.commit()

    return await get_cart_read(db, shop_id, user_id)


async def _validate_variant(
    db: AsyncSession, shop_id: uuid.UUID, variant_id: uuid.UUID
) -> ProductVariant:
    """Validate that a variant exists, is active, and belongs to the shop.

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        variant_id: UUID of the variant.

    Returns:
        ProductVariant instance.

    Raises:
        HTTPException 400: If variant is invalid.
    """
    result = await db.execute(
        select(ProductVariant)
        .join(Product, ProductVariant.product_id == Product.product_id)
        .where(
            ProductVariant.variant_id == variant_id,
            ProductVariant.is_active.is_(True),
            ProductVariant.deleted_at.is_(None),
            Product.shop_id == shop_id,
            Product.is_active.is_(True),
            Product.deleted_at.is_(None),
        )
    )
    variant = result.scalar_one_or_none()
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Variant not found, inactive, or not in this shop",
        )
    return variant
