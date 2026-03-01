"""State machine definitions for status transitions.

All status transitions are validated here. Business logic must call
validate_transition() before changing any entity's status.
"""

from app.models.enums import (
    OrderStatus,
    PaymentStatus,
    PayoutStatus,
    RefundStatus,
    ShopStatus,
)

# --- Order Status Transitions ---
VALID_ORDER_TRANSITIONS: dict[OrderStatus, list[OrderStatus]] = {
    OrderStatus.PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    OrderStatus.CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    OrderStatus.PROCESSING: [OrderStatus.READY, OrderStatus.CANCELLED],
    OrderStatus.READY: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    OrderStatus.SHIPPED: [OrderStatus.DELIVERED],
    OrderStatus.DELIVERED: [],
    OrderStatus.CANCELLED: [],
}

# --- Shop Status Transitions ---
VALID_SHOP_TRANSITIONS: dict[ShopStatus, list[ShopStatus]] = {
    ShopStatus.PENDING: [ShopStatus.ACTIVE, ShopStatus.REJECTED],
    ShopStatus.ACTIVE: [ShopStatus.PAUSED, ShopStatus.SUSPENDED, ShopStatus.CLOSED],
    ShopStatus.REJECTED: [ShopStatus.PENDING],
    ShopStatus.PAUSED: [ShopStatus.ACTIVE, ShopStatus.CLOSED],
    ShopStatus.SUSPENDED: [ShopStatus.ACTIVE, ShopStatus.BANNED],
    ShopStatus.BANNED: [],
    ShopStatus.CLOSED: [],
}

# --- Payment Status Transitions ---
VALID_PAYMENT_TRANSITIONS: dict[PaymentStatus, list[PaymentStatus]] = {
    PaymentStatus.PENDING: [
        PaymentStatus.COMPLETED,
        PaymentStatus.FAILED,
        PaymentStatus.EXPIRED,
    ],
    PaymentStatus.COMPLETED: [
        PaymentStatus.REFUNDED,
        PaymentStatus.PARTIALLY_REFUNDED,
    ],
    PaymentStatus.FAILED: [],
    PaymentStatus.EXPIRED: [],
    PaymentStatus.REFUNDED: [],
    PaymentStatus.PARTIALLY_REFUNDED: [PaymentStatus.REFUNDED],
}

# --- Refund Status Transitions ---
VALID_REFUND_TRANSITIONS: dict[RefundStatus, list[RefundStatus]] = {
    RefundStatus.REQUESTED: [
        RefundStatus.APPROVED,
        RefundStatus.REJECTED,
    ],
    RefundStatus.APPROVED: [RefundStatus.PROCESSING],
    RefundStatus.PROCESSING: [
        RefundStatus.COMPLETED,
        RefundStatus.FAILED,
    ],
    RefundStatus.COMPLETED: [],
    RefundStatus.FAILED: [RefundStatus.PROCESSING],
    RefundStatus.REJECTED: [],
}

# --- Payout Status Transitions ---
VALID_PAYOUT_TRANSITIONS: dict[PayoutStatus, list[PayoutStatus]] = {
    PayoutStatus.PENDING: [PayoutStatus.PROCESSING],
    PayoutStatus.PROCESSING: [PayoutStatus.COMPLETED, PayoutStatus.FAILED],
    PayoutStatus.COMPLETED: [],
    PayoutStatus.FAILED: [PayoutStatus.PROCESSING],
}


def validate_transition[T](
    current: T,
    new: T,
    transitions: dict[T, list[T]],
) -> bool:
    """Check whether a status transition is allowed.

    Args:
        current: The current status value.
        new: The target status value.
        transitions: The transition map for this entity type.

    Returns:
        True if the transition is valid, False otherwise.
    """
    return new in transitions.get(current, [])
