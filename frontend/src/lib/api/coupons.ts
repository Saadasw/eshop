/** Typed API wrappers for coupon CRUD and validation. */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type {
  CouponRead,
  CouponCreate,
  CouponUpdate,
  CouponValidateResponse,
  PaginatedResponse,
} from "@/types/database";

/** List coupons for a shop (owner/staff). */
export async function listCoupons(
  slug: string,
  params?: { skip?: number; limit?: number; is_active?: boolean },
): Promise<PaginatedResponse<CouponRead>> {
  const response = await api.get<PaginatedResponse<CouponRead>>(
    API_ROUTES.SHOP.COUPONS(slug),
    { params },
  );
  return response.data;
}

/** Create a coupon. */
export async function createCoupon(
  slug: string,
  data: CouponCreate,
): Promise<CouponRead> {
  const response = await api.post<CouponRead>(
    API_ROUTES.SHOP.COUPONS(slug),
    data,
  );
  return response.data;
}

/** Update a coupon. */
export async function updateCoupon(
  slug: string,
  couponId: string,
  data: CouponUpdate,
): Promise<CouponRead> {
  const response = await api.patch<CouponRead>(
    API_ROUTES.SHOP.COUPON(slug, couponId),
    data,
  );
  return response.data;
}

/** Soft-delete a coupon. */
export async function deleteCoupon(
  slug: string,
  couponId: string,
): Promise<void> {
  await api.delete(API_ROUTES.SHOP.COUPON(slug, couponId));
}

/** Validate a coupon code against a cart subtotal. */
export async function validateCoupon(
  slug: string,
  code: string,
  cartSubtotal: string,
): Promise<CouponValidateResponse> {
  const response = await api.post<CouponValidateResponse>(
    API_ROUTES.SHOP.COUPONS_VALIDATE(slug),
    { code },
    { params: { cart_subtotal: cartSubtotal } },
  );
  return response.data;
}
