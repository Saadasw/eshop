/** TanStack Query hooks for shop-scoped order management. */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listShopOrders,
  getShopOrder,
  updateOrderStatus,
  cancelShopOrder,
  type ShopOrderListParams,
  type ShopOrderCancelRequest,
} from "@/lib/api/shop-orders";
import type { OrderStatusUpdate } from "@/types/database";

/** Fetch orders for a shop (owner/staff view). */
export function useShopOrders(slug: string, params?: ShopOrderListParams) {
  return useQuery({
    queryKey: ["shop-orders", slug, params],
    queryFn: () => listShopOrders(slug, params),
    enabled: !!slug,
  });
}

/** Fetch a single shop order by ID. */
export function useShopOrder(slug: string, orderId: string) {
  return useQuery({
    queryKey: ["shop-order", slug, orderId],
    queryFn: () => getShopOrder(slug, orderId),
    enabled: !!slug && !!orderId,
  });
}

/** Mutation to update order status. */
export function useUpdateOrderStatus(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: OrderStatusUpdate;
    }) => updateOrderStatus(slug, orderId, data),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ["shop-order", slug, orderId] });
      queryClient.invalidateQueries({ queryKey: ["shop-orders", slug] });
    },
  });
}

/** Mutation to cancel a shop order. */
export function useCancelShopOrder(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data?: ShopOrderCancelRequest;
    }) => cancelShopOrder(slug, orderId, data),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ["shop-order", slug, orderId] });
      queryClient.invalidateQueries({ queryKey: ["shop-orders", slug] });
    },
  });
}
