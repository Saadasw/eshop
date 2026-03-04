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
    CATEGORIES: (slug: string) => `/api/v1/shops/${slug}/categories`,
    CART: (slug: string) => `/api/v1/shops/${slug}/cart`,
    CART_ITEMS: (slug: string) => `/api/v1/shops/${slug}/cart/items`,
    CART_ITEM: (slug: string, itemId: string) =>
      `/api/v1/shops/${slug}/cart/items/${itemId}`,
    ORDERS: (slug: string) => `/api/v1/shops/${slug}/orders`,
    FOLLOW: (slug: string) => `/api/v1/shops/${slug}/follow`,
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
