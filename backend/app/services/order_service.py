"""Order service — cart-to-order conversion, snapshots, status transitions."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.state_machines import VALID_ORDER_TRANSITIONS, validate_transition
from app.models.cart import Cart, CartItem, CustomerAddress
from app.models.enums import (
    FulfillmentType,
    OrderEventType,
    OrderPaymentStatus,
    OrderStatus,
)
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.product import Product, ProductMedia, ProductVariant
from app.models.shop import DeliveryZone, Shop, ShopConfig
from app.schemas.order import OrderCreate, OrderSummaryRead


async def create_order_from_cart(
    db: AsyncSession,
    shop: Shop,
    customer_id: uuid.UUID,
    data: OrderCreate,
) -> Order:
    """Convert the user's cart into an order with immutable snapshots.

    Steps:
    1. Load cart with items
    2. Validate stock for each item
    3. Snapshot product/variant data into order items
    4. Calculate totals (subtotal + delivery fee + tax - discount)
    5. Deduct stock
    6. Generate order number via DB function
    7. Snapshot delivery address and zone
    8. Create order + items + initial status history
    9. Clear the cart

    Args:
        db: Async database session.
        shop: The shop this order is for.
        customer_id: UUID of the customer placing the order.
        data: Order creation parameters (address, zone, fulfillment type, note).

    Returns:
        Created Order with items loaded.

    Raises:
        HTTPException 400: If cart is empty, stock insufficient, or invalid address/zone.
    """
    shop_id = shop.shop_id

    # 1. Load cart
    result = await db.execute(
        select(Cart)
        .where(Cart.shop_id == shop_id, Cart.user_id == customer_id)
        .options(selectinload(Cart.items))
    )
    cart = result.scalar_one_or_none()
    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty"
        )

    # 2. Load shop config for tax/delivery settings
    config_result = await db.execute(
        select(ShopConfig).where(ShopConfig.shop_id == shop_id)
    )
    config = config_result.scalar_one_or_none()

    # 3. Build order items with snapshots, validate stock
    order_items: list[OrderItem] = []
    subtotal = Decimal("0")

    for ci in cart.items:
        variant = await _load_variant_with_product(db, ci.variant_id)
        if not variant or not variant.product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Variant {ci.variant_id} is no longer available",
            )

        # Stock check
        if variant.track_inventory and ci.quantity > variant.stock_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{variant.product.name}' "
                       f"(variant: {variant.variant_name or 'default'}). "
                       f"Available: {variant.stock_quantity}, requested: {ci.quantity}",
            )

        # Get primary image for snapshot
        image_url = await _get_primary_image_url(db, variant.product_id)

        line_total = variant.price * ci.quantity
        subtotal += line_total

        order_items.append(OrderItem(
            variant_id=variant.variant_id,
            product_name_snapshot=variant.product.name,
            variant_name_snapshot=variant.variant_name,
            sku_snapshot=variant.sku,
            image_url_snapshot=image_url,
            quantity=ci.quantity,
            unit_price_snapshot=variant.price,
            line_total=line_total,
        ))

        # Deduct stock
        if variant.track_inventory:
            variant.stock_quantity -= ci.quantity

    # 4. Calculate delivery fee
    delivery_fee = Decimal("0")
    delivery_zone_name = None
    if data.fulfillment_type == FulfillmentType.DELIVERY and data.delivery_zone_id:
        zone_result = await db.execute(
            select(DeliveryZone).where(
                DeliveryZone.zone_id == data.delivery_zone_id,
                DeliveryZone.shop_id == shop_id,
                DeliveryZone.is_active.is_(True),
            )
        )
        zone = zone_result.scalar_one_or_none()
        if zone:
            delivery_fee = zone.delivery_fee
            delivery_zone_name = zone.zone_name
    elif config and config.flat_delivery_fee and data.fulfillment_type == FulfillmentType.DELIVERY:
        delivery_fee = config.flat_delivery_fee

    # 5. Calculate tax
    tax_amount = Decimal("0")
    if config and config.tax_percentage > 0:
        if config.tax_inclusive:
            # Tax is already included in prices
            tax_amount = subtotal - (subtotal / (1 + config.tax_percentage / 100))
        else:
            tax_amount = subtotal * config.tax_percentage / 100
    tax_amount = tax_amount.quantize(Decimal("0.01"))

    # 6. Total
    total_amount = subtotal + delivery_fee + (Decimal("0") if config and config.tax_inclusive else tax_amount)

    # 7. Snapshot delivery address
    delivery_address_snapshot = None
    if data.delivery_address_id:
        addr_result = await db.execute(
            select(CustomerAddress).where(
                CustomerAddress.address_id == data.delivery_address_id,
                CustomerAddress.user_id == customer_id,
                CustomerAddress.deleted_at.is_(None),
            )
        )
        addr = addr_result.scalar_one_or_none()
        if not addr:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Delivery address not found",
            )
        delivery_address_snapshot = {
            "recipient_name": addr.recipient_name,
            "phone": addr.phone,
            "street_address": addr.street_address,
            "area": addr.area,
            "city": addr.city,
            "postal_code": addr.postal_code,
        }

    # 8. Generate order number via DB function
    order_prefix = config.order_prefix if config else "KHG"
    order_number_result = await db.execute(
        text("SELECT generate_order_number(:prefix)"),
        {"prefix": order_prefix},
    )
    order_number = order_number_result.scalar_one()

    # 9. Create order
    order = Order(
        order_number=order_number,
        shop_id=shop_id,
        customer_id=customer_id,
        delivery_address_id=data.delivery_address_id,
        delivery_address_snapshot=delivery_address_snapshot,
        delivery_zone_id=data.delivery_zone_id,
        delivery_zone_name_snapshot=delivery_zone_name,
        fulfillment_type=data.fulfillment_type,
        status=OrderStatus.PENDING,
        payment_status=OrderPaymentStatus.UNPAID,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        tax_amount=tax_amount,
        discount_amount=Decimal("0"),
        total_amount=total_amount,
        customer_note=data.customer_note,
    )
    db.add(order)
    await db.flush()

    # Link order items
    for oi in order_items:
        oi.order_id = order.order_id
    db.add_all(order_items)

    # Initial status history entry
    db.add(OrderStatusHistory(
        order_id=order.order_id,
        from_status=None,
        to_status=OrderStatus.PENDING,
        event_type=OrderEventType.STATUS_CHANGE,
        description="Order placed",
        changed_by=customer_id,
    ))

    # 10. Clear cart
    for ci in cart.items:
        await db.delete(ci)

    await db.commit()

    return await get_order(db, order.order_id, customer_id=customer_id)


async def get_order(
    db: AsyncSession,
    order_id: uuid.UUID,
    customer_id: uuid.UUID | None = None,
    shop_id: uuid.UUID | None = None,
) -> Order:
    """Get a single order with items loaded.

    Either customer_id or shop_id must be provided for access control.

    Args:
        db: Async database session.
        order_id: UUID of the order.
        customer_id: If provided, verifies the customer owns the order.
        shop_id: If provided, verifies the order belongs to the shop.

    Returns:
        Order with items loaded.

    Raises:
        HTTPException 404: If order not found or access denied.
    """
    query = (
        select(Order)
        .where(Order.order_id == order_id, Order.deleted_at.is_(None))
        .options(selectinload(Order.items))
    )

    if customer_id:
        query = query.where(Order.customer_id == customer_id)
    if shop_id:
        query = query.where(Order.shop_id == shop_id)

    result = await db.execute(query)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )
    return order


async def list_customer_orders(
    db: AsyncSession,
    customer_id: uuid.UUID,
    skip: int = 0,
    limit: int = 20,
    status_filter: OrderStatus | None = None,
) -> tuple[list[Order], int]:
    """List orders for a customer across all shops.

    Args:
        db: Async database session.
        customer_id: UUID of the customer.
        skip: Offset for pagination.
        limit: Max results.
        status_filter: Optional status filter.

    Returns:
        Tuple of (orders, total count).
    """
    base = select(Order).where(
        Order.customer_id == customer_id,
        Order.deleted_at.is_(None),
    )
    if status_filter:
        base = base.where(Order.status == status_filter)

    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        base.options(selectinload(Order.items))
        .order_by(Order.ordered_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().unique().all()), total


async def list_shop_orders(
    db: AsyncSession,
    shop_id: uuid.UUID,
    skip: int = 0,
    limit: int = 20,
    status_filter: OrderStatus | None = None,
) -> tuple[list[Order], int]:
    """List orders for a shop (owner/staff view).

    Args:
        db: Async database session.
        shop_id: UUID of the shop.
        skip: Offset for pagination.
        limit: Max results.
        status_filter: Optional status filter.

    Returns:
        Tuple of (orders, total count).
    """
    base = select(Order).where(
        Order.shop_id == shop_id,
        Order.deleted_at.is_(None),
    )
    if status_filter:
        base = base.where(Order.status == status_filter)

    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        base.options(selectinload(Order.items))
        .order_by(Order.ordered_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().unique().all()), total


async def update_order_status(
    db: AsyncSession,
    order_id: uuid.UUID,
    shop_id: uuid.UUID,
    new_status: OrderStatus,
    changed_by: uuid.UUID,
    description: str | None = None,
) -> Order:
    """Update order status with state machine validation.

    Args:
        db: Async database session.
        order_id: UUID of the order.
        shop_id: UUID of the shop (for access control).
        new_status: Target status.
        changed_by: UUID of the user making the change.
        description: Optional description of the change.

    Returns:
        Updated Order.

    Raises:
        HTTPException 400: If the status transition is invalid.
    """
    order = await get_order(db, order_id, shop_id=shop_id)

    if not validate_transition(order.status, new_status, VALID_ORDER_TRANSITIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from '{order.status.value}' to '{new_status.value}'",
        )

    old_status = order.status
    order.status = new_status

    # Set timestamp fields
    now = datetime.now(timezone.utc)
    timestamp_map = {
        OrderStatus.CONFIRMED: "confirmed_at",
        OrderStatus.PROCESSING: "processing_at",
        OrderStatus.READY: "ready_at",
        OrderStatus.SHIPPED: "shipped_at",
        OrderStatus.DELIVERED: "delivered_at",
        OrderStatus.CANCELLED: "cancelled_at",
    }
    ts_field = timestamp_map.get(new_status)
    if ts_field:
        setattr(order, ts_field, now)

    # Record status history
    db.add(OrderStatusHistory(
        order_id=order.order_id,
        from_status=old_status,
        to_status=new_status,
        event_type=OrderEventType.STATUS_CHANGE,
        description=description,
        changed_by=changed_by,
    ))

    await db.commit()
    return await get_order(db, order_id, shop_id=shop_id)


async def cancel_order(
    db: AsyncSession,
    order_id: uuid.UUID,
    cancelled_by: uuid.UUID,
    cancel_reason: str | None = None,
    customer_id: uuid.UUID | None = None,
    shop_id: uuid.UUID | None = None,
) -> Order:
    """Cancel an order and restore stock.

    Args:
        db: Async database session.
        order_id: UUID of the order.
        cancelled_by: UUID of the user cancelling.
        cancel_reason: Reason for cancellation.
        customer_id: If cancelling as a customer.
        shop_id: If cancelling as shop owner/staff.

    Returns:
        Updated Order.

    Raises:
        HTTPException 400: If order cannot be cancelled.
    """
    order = await get_order(db, order_id, customer_id=customer_id, shop_id=shop_id)

    if not validate_transition(order.status, OrderStatus.CANCELLED, VALID_ORDER_TRANSITIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel order in '{order.status.value}' status",
        )

    old_status = order.status
    order.status = OrderStatus.CANCELLED
    order.cancelled_at = datetime.now(timezone.utc)
    order.cancelled_by = cancelled_by
    order.cancel_reason = cancel_reason

    # Restore stock for each order item
    for item in order.items:
        v_result = await db.execute(
            select(ProductVariant).where(
                ProductVariant.variant_id == item.variant_id
            )
        )
        variant = v_result.scalar_one_or_none()
        if variant and variant.track_inventory:
            variant.stock_quantity += item.quantity

    # Record status history
    db.add(OrderStatusHistory(
        order_id=order.order_id,
        from_status=old_status,
        to_status=OrderStatus.CANCELLED,
        event_type=OrderEventType.STATUS_CHANGE,
        description=cancel_reason or "Order cancelled",
        changed_by=cancelled_by,
    ))

    await db.commit()
    return await get_order(db, order_id, customer_id=customer_id, shop_id=shop_id)


# --- Helpers ---


async def _load_variant_with_product(
    db: AsyncSession, variant_id: uuid.UUID
) -> ProductVariant | None:
    """Load a variant with its parent product.

    Args:
        db: Async database session.
        variant_id: UUID of the variant.

    Returns:
        ProductVariant with product loaded, or None.
    """
    result = await db.execute(
        select(ProductVariant)
        .where(
            ProductVariant.variant_id == variant_id,
            ProductVariant.is_active.is_(True),
            ProductVariant.deleted_at.is_(None),
        )
        .options(selectinload(ProductVariant.product))
    )
    return result.scalar_one_or_none()


async def _get_primary_image_url(
    db: AsyncSession, product_id: uuid.UUID
) -> str | None:
    """Get the primary image URL for a product.

    Args:
        db: Async database session.
        product_id: UUID of the product.

    Returns:
        Image URL or None.
    """
    result = await db.execute(
        select(ProductMedia.file_url).where(
            ProductMedia.product_id == product_id,
            ProductMedia.is_primary.is_(True),
        )
    )
    return result.scalar_one_or_none()
