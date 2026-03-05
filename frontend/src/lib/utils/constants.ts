/** Centralized constants for the frontend application. */

/** Backend API endpoint paths. */
export const API_ROUTES = {
  AUTH: {
    REGISTER: "/api/v1/auth/register",
    LOGIN: "/api/v1/auth/login",
    REFRESH: "/api/v1/auth/refresh",
    LOGOUT: "/api/v1/auth/logout",
    ME: "/api/v1/auth/me",
  },
  SHOPS: "/api/v1/shops",
  /** Shop-scoped sub-routes — append to `${SHOPS}/${slug}`. */
  SHOP: {
    PRODUCTS: (slug: string) => `/api/v1/shops/${slug}/products`,
    PRODUCT: (slug: string, id: string) =>
      `/api/v1/shops/${slug}/products/${id}`,
    PRODUCT_VARIANTS: (slug: string, id: string) =>
      `/api/v1/shops/${slug}/products/${id}/variants`,
    PRODUCT_VARIANT: (slug: string, productId: string, variantId: string) =>
      `/api/v1/shops/${slug}/products/${productId}/variants/${variantId}`,
    PRODUCT_MEDIA: (slug: string, id: string) =>
      `/api/v1/shops/${slug}/products/${id}/media`,
    PRODUCT_MEDIA_ITEM: (slug: string, productId: string, mediaId: string) =>
      `/api/v1/shops/${slug}/products/${productId}/media/${mediaId}`,
    PRODUCT_MEDIA_PRIMARY: (slug: string, productId: string, mediaId: string) =>
      `/api/v1/shops/${slug}/products/${productId}/media/${mediaId}/primary`,
    CATEGORIES: (slug: string) => `/api/v1/shops/${slug}/categories`,
    CATEGORY: (slug: string, id: string) =>
      `/api/v1/shops/${slug}/categories/${id}`,
    CART: (slug: string) => `/api/v1/shops/${slug}/cart`,
    CART_ITEMS: (slug: string) => `/api/v1/shops/${slug}/cart/items`,
    CART_ITEM: (slug: string, itemId: string) =>
      `/api/v1/shops/${slug}/cart/items/${itemId}`,
    ORDERS: (slug: string) => `/api/v1/shops/${slug}/orders`,
    SHOP_ORDER: (slug: string, orderId: string) =>
      `/api/v1/shops/${slug}/orders/${orderId}`,
    SHOP_ORDER_STATUS: (slug: string, orderId: string) =>
      `/api/v1/shops/${slug}/orders/${orderId}/status`,
    SHOP_ORDER_CANCEL: (slug: string, orderId: string) =>
      `/api/v1/shops/${slug}/orders/${orderId}/cancel`,
    FOLLOW: (slug: string) => `/api/v1/shops/${slug}/follow`,
    SETTINGS: (slug: string) => `/api/v1/shops/${slug}/settings`,
    DELIVERY_ZONES: (slug: string) => `/api/v1/shops/${slug}/delivery-zones`,
    DELIVERY_ZONE: (slug: string, zoneId: string) =>
      `/api/v1/shops/${slug}/delivery-zones/${zoneId}`,
    PAYMENT_METHODS: (slug: string) =>
      `/api/v1/shops/${slug}/payment-methods`,
    PAYMENT_METHOD: (slug: string, spmId: string) =>
      `/api/v1/shops/${slug}/payment-methods/${spmId}`,
    STAFF: (slug: string) => `/api/v1/shops/${slug}/staff`,
    STAFF_MEMBER: (slug: string, staffId: string) =>
      `/api/v1/shops/${slug}/staff/${staffId}`,
    ADDRESSES: (slug: string) => `/api/v1/shops/${slug}/addresses`,
    ADDRESS: (slug: string, addressId: string) =>
      `/api/v1/shops/${slug}/addresses/${addressId}`,
    COUPONS: (slug: string) => `/api/v1/shops/${slug}/coupons`,
    COUPON: (slug: string, couponId: string) =>
      `/api/v1/shops/${slug}/coupons/${couponId}`,
    COUPONS_VALIDATE: (slug: string) => `/api/v1/shops/${slug}/coupons/validate`,
    REVIEWS: (slug: string, productId: string) =>
      `/api/v1/shops/${slug}/products/${productId}/reviews`,
    REVIEW_REPLY: (slug: string, reviewId: string) =>
      `/api/v1/shops/${slug}/reviews/${reviewId}/reply`,
    REVIEW_DELETE: (slug: string, reviewId: string) =>
      `/api/v1/shops/${slug}/reviews/${reviewId}`,
    ATTRIBUTES: (slug: string) => `/api/v1/shops/${slug}/attributes`,
    ATTRIBUTE_OPTIONS: (slug: string, attrId: string) =>
      `/api/v1/shops/${slug}/attributes/${attrId}/options`,
  },
  ORDERS: "/api/v1/orders",
  ORDER: (orderId: string) => `/api/v1/orders/${orderId}`,
  ORDER_CANCEL: (orderId: string) => `/api/v1/orders/${orderId}/cancel`,
  ADDRESSES: "/api/v1/addresses",
  WISHLIST: "/api/v1/wishlist",
  NOTIFICATIONS: "/api/v1/notifications",
} as const;

/** Frontend page paths. */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY_OTP: "/verify-otp",
  SHOPS: "/shops",
  SHOP: (slug: string) => `/${slug}`,
  PRODUCT: (slug: string, productId: string) =>
    `/${slug}/products/${productId}`,
  CART: (slug: string) => `/${slug}/cart`,
  CHECKOUT: (slug: string) => `/${slug}/checkout`,
  ORDERS: "/orders",
  ORDER_DETAIL: (orderId: string) => `/orders/${orderId}`,
  DASHBOARD: (slug: string) => `/dashboard/${slug}`,
  DASHBOARD_ORDERS: (slug: string) => `/dashboard/${slug}/orders`,
  DASHBOARD_ORDER_DETAIL: (slug: string, orderId: string) =>
    `/dashboard/${slug}/orders/${orderId}`,
  DASHBOARD_PRODUCTS: (slug: string) => `/dashboard/${slug}/products`,
  DASHBOARD_PRODUCT_NEW: (slug: string) => `/dashboard/${slug}/products/new`,
  DASHBOARD_PRODUCT_EDIT: (slug: string, productId: string) =>
    `/dashboard/${slug}/products/${productId}/edit`,
  DASHBOARD_CATEGORIES: (slug: string) => `/dashboard/${slug}/categories`,
  DASHBOARD_SETTINGS: (slug: string) => `/dashboard/${slug}/settings`,
  DASHBOARD_COUPONS: (slug: string) => `/dashboard/${slug}/coupons`,
  DASHBOARD_REVIEWS: (slug: string) => `/dashboard/${slug}/reviews`,
} as const;

/** localStorage / cookie key names for auth tokens. */
export const TOKEN_KEYS = {
  ACCESS_TOKEN: "eshop_access_token",
  REFRESH_TOKEN: "eshop_refresh_token",
} as const;

/** Bangladesh-specific constants. */
export const BD = {
  TIMEZONE: "Asia/Dhaka",
  CURRENCY_CODE: "BDT",
  CURRENCY_SYMBOL: "\u09F3",
  PHONE_REGEX: /^01[3-9]\d{8}$/,
  LOCALE_BN: "bn-BD",
  LOCALE_EN: "en-BD",
} as const;

/** Product listing sort options for the sort select dropdown. */
export const PRODUCT_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "popular", label: "Most Popular" },
] as const;

/** Default page size for paginated lists. */
export const DEFAULT_PAGE_SIZE = 20;

/** Static paths that should not be treated as shop slugs. */
export const STATIC_PATHS = [
  "shops",
  "login",
  "register",
  "verify-otp",
  "orders",
  "dashboard",
  "admin",
] as const;
