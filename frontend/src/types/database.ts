/**
 * TypeScript types mirroring backend Pydantic schemas and PostgreSQL enums.
 *
 * UUID fields are strings (serialized from Python uuid.UUID).
 * Decimal fields are strings (serialized from Python Decimal).
 * Datetime fields are ISO 8601 UTC strings (e.g. "2026-03-02T10:30:00Z").
 */

// --- Enums (match backend/app/models/enums.py) ---

export type UserRole = "owner" | "staff" | "customer" | "admin";
export type DeviceType = "mobile" | "desktop" | "tablet";

export type ShopStatus =
  | "pending"
  | "active"
  | "rejected"
  | "paused"
  | "suspended"
  | "banned"
  | "closed";

export type DeliveryChargeType = "flat" | "zone" | "free";
export type StaffRole = "manager" | "cashier" | "delivery_boy";
export type ShopAddressType = "main" | "branch" | "warehouse";

export type ProductType = "physical" | "digital" | "service";
export type MediaType = "image" | "video";

export type PaymentMethod =
  | "bkash"
  | "nagad"
  | "rocket"
  | "cod"
  | "card"
  | "bank_transfer";

export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "expired"
  | "refunded"
  | "partially_refunded";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderPaymentStatus =
  | "unpaid"
  | "partially_paid"
  | "paid"
  | "refunded";

export type FulfillmentType = "delivery" | "pickup";
export type OrderItemStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "returned";

export type OrderEventType =
  | "status_change"
  | "note"
  | "delivery_attempt"
  | "dispute"
  | "custom";

export type RefundType = "refund" | "exchange";
export type RefundStatus =
  | "requested"
  | "approved"
  | "processing"
  | "completed"
  | "failed"
  | "rejected";

export type PayoutStatus = "pending" | "processing" | "completed" | "failed";
export type PayoutMethod = "bkash" | "nagad" | "bank_transfer";

export type DiscountType = "percentage" | "fixed";
export type CouponScope = "all" | "category" | "product";

export type NotificationType =
  | "order_placed"
  | "order_update"
  | "order_assigned"
  | "low_stock"
  | "review"
  | "promotion"
  | "follower_update"
  | "refund_update"
  | "payout_completed"
  | "system"
  | "security_alert";

export type NotificationChannel = "in_app" | "push" | "sms" | "email";

// --- Common ---

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface ErrorResponse {
  detail: string;
}

// --- Auth ---

export interface RegisterRequest {
  supabase_token: string;
  full_name: string;
  email: string;
  phone: string;
  password?: string | null;
}

export interface LoginRequest {
  supabase_token: string;
  ip_address?: string | null;
  user_agent?: string | null;
  device_type?: DeviceType | null;
  device_name?: string | null;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse {
  tokens: TokenPair;
  user: UserRead;
}

// --- User ---

export interface UserRead {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  primary_role: UserRole;
  avatar_url: string | null;
  preferred_language: string;
  is_verified: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface UserUpdate {
  full_name?: string | null;
  avatar_url?: string | null;
  preferred_language?: string | null;
}

// --- Shop ---

export interface ShopCreate {
  shop_name: string;
  slug: string;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  trade_license_no?: string | null;
  nid_number?: string | null;
}

export interface ShopRead {
  shop_id: string;
  owner_id: string;
  slug: string;
  shop_name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: ShopStatus;
  avg_rating: string;
  created_at: string;
}

export interface ShopUpdate {
  shop_name?: string | null;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
}

export interface ShopConfigRead {
  config_id: string;
  shop_id: string;
  theme_color: string | null;
  custom_domain: string | null;
  currency: string;
  order_prefix: string;
  tax_percentage: string;
  tax_inclusive: boolean;
  return_policy_days: number;
  accepting_orders: boolean;
  delivery_enabled: boolean;
  delivery_charge_type: DeliveryChargeType;
  flat_delivery_fee: string | null;
  min_order_amount: string | null;
  auto_accept_orders: boolean;
  business_hours: Record<string, unknown> | null;
  sms_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  meta_title: string | null;
  meta_description: string | null;
}

export interface DeliveryZoneRead {
  zone_id: string;
  shop_id: string;
  zone_name: string;
  areas: string[];
  delivery_fee: string;
  estimated_time_minutes: number | null;
  sort_order: number;
  is_active: boolean;
}

export interface StaffRead {
  staff_id: string;
  shop_id: string;
  user_id: string;
  role: StaffRole;
  permissions: Record<string, unknown> | null;
  is_active: boolean;
  joined_at: string;
}

export interface ShopPaymentMethodRead {
  spm_id: string;
  shop_id: string;
  method: PaymentMethod;
  is_enabled: boolean;
  merchant_id: string | null;
  display_account: string | null;
  sort_order: number;
}

// --- Category ---

export interface CategoryRead {
  category_id: string;
  shop_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  icon_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// --- Product ---

export interface VariantRead {
  variant_id: string;
  product_id: string;
  sku: string;
  variant_name: string | null;
  price: string;
  compare_at_price: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  weight_grams: number | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ProductMediaRead {
  media_id: string;
  product_id: string;
  file_url: string;
  media_type: MediaType;
  alt_text: string | null;
  file_size_bytes: number | null;
  sort_order: number;
  is_primary: boolean;
  uploaded_at: string;
}

export interface ProductRead {
  product_id: string;
  shop_id: string;
  category_id: string | null;
  sku: string;
  name: string;
  description: string | null;
  base_price: string;
  compare_at_price: string | null;
  min_price: string | null;
  max_price: string | null;
  product_type: ProductType;
  brand: string | null;
  weight_grams: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  total_sales: number;
  avg_rating: string;
  review_count: number;
  created_at: string;
  variants: VariantRead[];
  media: ProductMediaRead[];
  tags: string[];
}

// --- Cart ---

export interface CartItemRead {
  cart_item_id: string;
  variant_id: string;
  quantity: number;
  variant_name: string | null;
  product_name: string | null;
  sku: string | null;
  unit_price: string | null;
  image_url: string | null;
  stock_quantity: number | null;
}

export interface CartRead {
  cart_id: string;
  shop_id: string;
  user_id: string | null;
  items: CartItemRead[];
  item_count: number;
  subtotal: string;
}

// --- Order ---

export interface OrderItemRead {
  item_id: string;
  variant_id: string;
  product_name_snapshot: string;
  variant_name_snapshot: string | null;
  sku_snapshot: string;
  image_url_snapshot: string | null;
  quantity: number;
  unit_price_snapshot: string;
  discount_amount: string;
  line_total: string;
  status: OrderItemStatus;
}

export interface OrderStatusHistoryRead {
  history_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  event_type: OrderEventType;
  description: string | null;
  changed_by: string;
  changed_at: string;
}

export interface OrderRead {
  order_id: string;
  order_number: string;
  shop_id: string;
  customer_id: string;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  fulfillment_type: FulfillmentType;
  subtotal: string;
  delivery_fee: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  customer_note: string | null;
  shop_note: string | null;
  tracking_number: string | null;
  delivery_partner: string | null;
  coupon_code_snapshot: string | null;
  delivery_address_snapshot: Record<string, unknown> | null;
  delivery_zone_name_snapshot: string | null;
  cancel_reason: string | null;
  ordered_at: string;
  confirmed_at: string | null;
  processing_at: string | null;
  ready_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  items: OrderItemRead[];
}

export interface OrderSummaryRead {
  order_id: string;
  order_number: string;
  shop_id: string;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  total_amount: string;
  item_count: number;
  ordered_at: string;
}
