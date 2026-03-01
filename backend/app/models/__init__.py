"""Re-export all ORM models so `from app.models import User, Shop, ...` works."""

from app.models.archive import AuditLogArchive, OrderArchive, PaymentArchive
from app.models.audit import AuditLog, BulkJob, PlatformSetting
from app.models.cart import Cart, CartItem, CustomerAddress, Wishlist
from app.models.coupon import Coupon, CouponUsage
from app.models.enums import (
    AuditAction,
    BulkJobStatus,
    BulkJobType,
    CouponScope,
    DeliveryChargeType,
    DeviceType,
    DiscountType,
    FulfillmentType,
    MediaType,
    NotificationChannel,
    NotificationType,
    OrderEventType,
    OrderItemStatus,
    OrderPaymentStatus,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    PayoutMethod,
    PayoutStatus,
    ProductType,
    RefundStatus,
    RefundType,
    ShopAddressType,
    ShopStatus,
    StaffRole,
    UserRole,
)
from app.models.notification import Notification
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.payment import Payment, Payout, Refund, RefundItem
from app.models.product import (
    AttributeOption,
    Category,
    Product,
    ProductAttribute,
    ProductMedia,
    ProductTag,
    ProductVariant,
    VariantAttributeOption,
    VariantMedia,
)
from app.models.review import Review
from app.models.shop import (
    DeliveryZone,
    Shop,
    ShopAddress,
    ShopConfig,
    ShopFollower,
    ShopPaymentMethod,
    ShopStaff,
)
from app.models.user import LoginAttempt, PasswordHistory, User, UserSession

__all__ = [
    # User domain
    "User",
    "UserSession",
    "LoginAttempt",
    "PasswordHistory",
    # Shop domain
    "Shop",
    "ShopConfig",
    "ShopAddress",
    "ShopStaff",
    "ShopPaymentMethod",
    "DeliveryZone",
    "ShopFollower",
    # Product domain
    "Category",
    "Product",
    "ProductAttribute",
    "AttributeOption",
    "ProductVariant",
    "VariantAttributeOption",
    "ProductMedia",
    "VariantMedia",
    "ProductTag",
    # Cart domain
    "Cart",
    "CartItem",
    "Wishlist",
    "CustomerAddress",
    # Order domain
    "Order",
    "OrderItem",
    "OrderStatusHistory",
    # Payment domain
    "Payment",
    "Refund",
    "RefundItem",
    "Payout",
    # Coupon domain
    "Coupon",
    "CouponUsage",
    # Review
    "Review",
    # Notification
    "Notification",
    # Audit & operations
    "AuditLog",
    "BulkJob",
    "PlatformSetting",
    # Archive
    "OrderArchive",
    "PaymentArchive",
    "AuditLogArchive",
    # Enums
    "UserRole",
    "DeviceType",
    "ShopStatus",
    "DeliveryChargeType",
    "StaffRole",
    "ShopAddressType",
    "ProductType",
    "MediaType",
    "PaymentMethod",
    "PaymentStatus",
    "OrderStatus",
    "OrderPaymentStatus",
    "FulfillmentType",
    "OrderItemStatus",
    "OrderEventType",
    "RefundType",
    "RefundStatus",
    "PayoutStatus",
    "PayoutMethod",
    "DiscountType",
    "CouponScope",
    "NotificationType",
    "NotificationChannel",
    "AuditAction",
    "BulkJobType",
    "BulkJobStatus",
]
