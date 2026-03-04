/** TanStack Query hooks for order data and mutations. */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listOrders,
  getOrder,
  createOrder,
  cancelOrder,
  type OrderCreateRequest,
  type OrderListParams,
  type OrderCancelRequest,
} from "@/lib/api/orders";

/** Fetch the current user's orders across all shops. */
export function useOrders(params?: OrderListParams) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => listOrders(params),
  });
}

/** Fetch a single order by ID. */
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
  });
}

/** Mutation to create an order from the current cart. */
export function useCreateOrder(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OrderCreateRequest) => createOrder(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", slug] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

/** Mutation to cancel an order. */
export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data?: OrderCancelRequest;
    }) => cancelOrder(orderId, data),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
