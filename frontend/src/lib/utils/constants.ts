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
  ORDERS: "/api/v1/orders",
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
  SHOP: (slug: string) => `/${slug}`,
  PRODUCT: (slug: string, productId: string) => `/${slug}/products/${productId}`,
  CART: (slug: string) => `/${slug}/cart`,
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
