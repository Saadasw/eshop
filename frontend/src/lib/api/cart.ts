/** Typed API wrappers for cart endpoints. */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type { CartRead } from "@/types/database";

export interface AddCartItemRequest {
  variant_id: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

/** Get the current user's cart for a shop. */
export async function getCart(slug: string): Promise<CartRead> {
  const response = await api.get<CartRead>(API_ROUTES.SHOP.CART(slug));
  return response.data;
}

/** Add an item to the cart. */
export async function addCartItem(
  slug: string,
  data: AddCartItemRequest,
): Promise<CartRead> {
  const response = await api.post<CartRead>(API_ROUTES.SHOP.CART(slug), data);
  return response.data;
}

/** Update a cart item's quantity. */
export async function updateCartItem(
  slug: string,
  itemId: string,
  data: UpdateCartItemRequest,
): Promise<CartRead> {
  const response = await api.patch<CartRead>(
    API_ROUTES.SHOP.CART_ITEM(slug, itemId),
    data,
  );
  return response.data;
}

/** Remove an item from the cart. */
export async function removeCartItem(
  slug: string,
  itemId: string,
): Promise<CartRead> {
  const response = await api.delete<CartRead>(
    API_ROUTES.SHOP.CART_ITEM(slug, itemId),
  );
  return response.data;
}

/** Clear all items from the cart. */
export async function clearCart(slug: string): Promise<void> {
  await api.delete(API_ROUTES.SHOP.CART(slug));
}
