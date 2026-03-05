/** Typed API wrappers for wishlist operations. */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type {
  WishlistItemRead,
  WishlistItemAdd,
  PaginatedResponse,
} from "@/types/database";

/** List current user's wishlist. */
export async function listWishlist(
  params?: { skip?: number; limit?: number },
): Promise<PaginatedResponse<WishlistItemRead>> {
  const response = await api.get<PaginatedResponse<WishlistItemRead>>(
    API_ROUTES.WISHLIST,
    { params },
  );
  return response.data;
}

/** Add a product to the wishlist. */
export async function addToWishlist(
  data: WishlistItemAdd,
): Promise<WishlistItemRead> {
  const response = await api.post<WishlistItemRead>(API_ROUTES.WISHLIST, data);
  return response.data;
}

/** Remove an item from the wishlist. */
export async function removeFromWishlist(wishlistId: string): Promise<void> {
  await api.delete(API_ROUTES.WISHLIST_ITEM(wishlistId));
}
