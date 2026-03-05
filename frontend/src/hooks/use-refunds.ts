/** TanStack Query hooks for refund operations. */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  requestRefund,
  listShopRefunds,
  getShopRefund,
  updateRefundStatus,
} from "@/lib/api/refunds";
import type { RefundRequest, RefundStatusUpdate } from "@/types/database";

/** Request a refund for an order (customer). */
export function useRequestRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: RefundRequest }) =>
      requestRefund(orderId, data),
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
  });
}

/** List refunds for a shop (dashboard). */
export function useShopRefunds(
  slug: string,
  params?: { skip?: number; limit?: number; status?: string },
) {
  return useQuery({
    queryKey: ["shop-refunds", slug, params],
    queryFn: () => listShopRefunds(slug, params),
    enabled: !!slug,
  });
}

/** Get a single refund (dashboard). */
export function useShopRefund(slug: string, refundId: string) {
  return useQuery({
    queryKey: ["shop-refund", slug, refundId],
    queryFn: () => getShopRefund(slug, refundId),
    enabled: !!slug && !!refundId,
  });
}

/** Update refund status (dashboard). */
export function useUpdateRefundStatus(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      refundId,
      data,
    }: {
      refundId: string;
      data: RefundStatusUpdate;
    }) => updateRefundStatus(slug, refundId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-refunds", slug] });
    },
  });
}
