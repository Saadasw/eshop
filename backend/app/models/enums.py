"""PostgreSQL ENUM types mirrored as Python enums."""

import enum


# --- Identity ---

class UserRole(str, enum.Enum):
    """Maps to user_role ENUM."""
    OWNER = "owner"
    STAFF = "staff"
    CUSTOMER = "customer"
    ADMIN = "admin"


class DeviceType(str, enum.Enum):
    """Maps to device_type ENUM."""
    MOBILE = "mobile"
    DESKTOP = "desktop"
    TABLET = "tablet"


# --- Shop ---

class ShopStatus(str, enum.Enum):
    """Maps to shop_status ENUM."""
    PENDING = "pending"
    ACTIVE = "active"
    REJECTED = "rejected"
    PAUSED = "paused"
    SUSPENDED = "suspended"
    BANNED = "banned"
    CLOSED = "closed"


class DeliveryChargeType(str, enum.Enum):
    """Maps to delivery_charge_type ENUM."""
    FLAT = "flat"
    ZONE = "zone"
    FREE = "free"


class StaffRole(str, enum.Enum):
    """Maps to staff_role ENUM."""
    MANAGER = "manager"
    CASHIER = "cashier"
    DELIVERY_BOY = "delivery_boy"


class ShopAddressType(str, enum.Enum):
    """Maps to shop_address_type ENUM."""
    MAIN = "main"
    BRANCH = "branch"
    WAREHOUSE = "warehouse"


# --- Product ---

class ProductType(str, enum.Enum):
    """Maps to product_type ENUM."""
    PHYSICAL = "physical"
    DIGITAL = "digital"
    SERVICE = "service"


class MediaType(str, enum.Enum):
    """Maps to media_type ENUM."""
    IMAGE = "image"
    VIDEO = "video"


# --- Payment ---

class PaymentMethod(str, enum.Enum):
    """Maps to payment_method ENUM."""
    BKASH = "bkash"
    NAGAD = "nagad"
    ROCKET = "rocket"
    COD = "cod"
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"


class PaymentStatus(str, enum.Enum):
    """Maps to payment_status ENUM."""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


# --- Order ---

class OrderStatus(str, enum.Enum):
    """Maps to order_status ENUM."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    READY = "ready"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class OrderPaymentStatus(str, enum.Enum):
    """Maps to order_payment_status ENUM."""
    UNPAID = "unpaid"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    REFUNDED = "refunded"


class FulfillmentType(str, enum.Enum):
    """Maps to fulfillment_type ENUM."""
    DELIVERY = "delivery"
    PICKUP = "pickup"


class OrderItemStatus(str, enum.Enum):
    """Maps to order_item_status ENUM."""
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    RETURNED = "returned"


class OrderEventType(str, enum.Enum):
    """Maps to order_event_type ENUM."""
    STATUS_CHANGE = "status_change"
    NOTE = "note"
    DELIVERY_ATTEMPT = "delivery_attempt"
    DISPUTE = "dispute"
    CUSTOM = "custom"


# --- Refund ---

class RefundType(str, enum.Enum):
    """Maps to refund_type ENUM."""
    REFUND = "refund"
    EXCHANGE = "exchange"


class RefundStatus(str, enum.Enum):
    """Maps to refund_status ENUM."""
    REQUESTED = "requested"
    APPROVED = "approved"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REJECTED = "rejected"


# --- Payout ---

class PayoutStatus(str, enum.Enum):
    """Maps to payout_status ENUM."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class PayoutMethod(str, enum.Enum):
    """Maps to payout_method ENUM."""
    BKASH = "bkash"
    NAGAD = "nagad"
    BANK_TRANSFER = "bank_transfer"


# --- Coupon ---

class DiscountType(str, enum.Enum):
    """Maps to discount_type ENUM."""
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class CouponScope(str, enum.Enum):
    """Maps to coupon_scope ENUM."""
    ALL = "all"
    CATEGORY = "category"
    PRODUCT = "product"


# --- Notification ---

class NotificationType(str, enum.Enum):
    """Maps to notification_type ENUM."""
    ORDER_PLACED = "order_placed"
    ORDER_UPDATE = "order_update"
    ORDER_ASSIGNED = "order_assigned"
    LOW_STOCK = "low_stock"
    REVIEW = "review"
    PROMOTION = "promotion"
    FOLLOWER_UPDATE = "follower_update"
    REFUND_UPDATE = "refund_update"
    PAYOUT_COMPLETED = "payout_completed"
    SYSTEM = "system"
    SECURITY_ALERT = "security_alert"


class NotificationChannel(str, enum.Enum):
    """Maps to notification_channel ENUM."""
    IN_APP = "in_app"
    PUSH = "push"
    SMS = "sms"
    EMAIL = "email"


# --- Audit ---

class AuditAction(str, enum.Enum):
    """Maps to audit_action ENUM."""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    SOFT_DELETE = "soft_delete"
    RESTORE = "restore"
    STATUS_CHANGE = "status_change"
    LOGIN = "login"
    LOGOUT = "logout"
    ANONYMIZE = "anonymize"
    EXPORT = "export"
    IMPORT = "import"


# --- Bulk Job ---

class BulkJobType(str, enum.Enum):
    """Maps to bulk_job_type ENUM."""
    PRODUCT_IMPORT = "product_import"
    PRODUCT_EXPORT = "product_export"
    ORDER_EXPORT = "order_export"
    INVENTORY_UPDATE = "inventory_update"


class BulkJobStatus(str, enum.Enum):
    """Maps to bulk_job_status ENUM."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIALLY_COMPLETED = "partially_completed"
