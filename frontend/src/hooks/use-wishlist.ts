/** TanStack Query hooks for wishlist operations. */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listWishlist,
  addToWishlist,
  removeFromWishlist,
} from "@/lib/api/wishlist";
import type { WishlistItemAdd } from "@/types/database";

/** List current user's wishlist. */
export function useWishlist(
  params?: { skip?: number; limit?: number },
  enabled = true,
) {
  return useQuery({
    queryKey: ["wishlist", params],
    queryFn: () => listWishlist(params),
    enabled,
  });
}

/** Add a product to the wishlist. */
export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: WishlistItemAdd) => addToWishlist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

/** Remove an item from the wishlist. */
export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (wishlistId: string) => removeFromWishlist(wishlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}
