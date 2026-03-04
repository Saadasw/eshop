/** TanStack Query hooks for cart data and mutations. */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  type AddCartItemRequest,
} from "@/lib/api/cart";
import { useAuth } from "@/providers/auth-provider";

/** Fetch the current user's cart for a shop. Disabled when not authenticated. */
export function useCart(slug: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cart", slug],
    queryFn: () => getCart(slug),
    enabled: !!user && !!slug,
  });
}

/** Mutation to add an item to the cart. Invalidates cart query on success. */
export function useAddToCart(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCartItemRequest) => addCartItem(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", slug] });
    },
  });
}

/** Mutation to update a cart item's quantity. */
export function useUpdateCartItem(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(slug, itemId, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", slug] });
    },
  });
}

/** Mutation to remove an item from the cart. */
export function useRemoveCartItem(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(slug, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", slug] });
    },
  });
}

/** Mutation to clear all items from the cart. */
export function useClearCart(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearCart(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", slug] });
    },
  });
}
