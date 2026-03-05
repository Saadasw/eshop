/** TanStack Query hooks for coupon CRUD and validation. */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "@/lib/api/coupons";
import type { CouponCreate, CouponUpdate } from "@/types/database";

/** Fetch coupons for a shop (dashboard). */
export function useCoupons(
  slug: string,
  params?: { skip?: number; limit?: number; is_active?: boolean },
) {
  return useQuery({
    queryKey: ["coupons", slug, params],
    queryFn: () => listCoupons(slug, params),
    enabled: !!slug,
  });
}

/** Mutation to create a coupon. */
export function useCreateCoupon(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CouponCreate) => createCoupon(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons", slug] });
    },
  });
}

/** Mutation to update a coupon. */
export function useUpdateCoupon(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      couponId,
      data,
    }: {
      couponId: string;
      data: CouponUpdate;
    }) => updateCoupon(slug, couponId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons", slug] });
    },
  });
}

/** Mutation to delete a coupon. */
export function useDeleteCoupon(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (couponId: string) => deleteCoupon(slug, couponId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons", slug] });
    },
  });
}

/** Mutation to validate a coupon code. */
export function useValidateCoupon(slug: string) {
  return useMutation({
    mutationFn: ({ code, cartSubtotal }: { code: string; cartSubtotal: string }) =>
      validateCoupon(slug, code, cartSubtotal),
  });
}
