/** Typed API wrappers for shop endpoints. */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type { PaginatedResponse, ShopRead } from "@/types/database";

export interface ShopListParams {
  skip?: number;
  limit?: number;
  search?: string;
  owner_id?: string;
}

/** List active shops with optional search and pagination. */
export async function listShops(
  params?: ShopListParams,
): Promise<PaginatedResponse<ShopRead>> {
  const response = await api.get<PaginatedResponse<ShopRead>>(
    API_ROUTES.SHOPS,
    { params },
  );
  return response.data;
}

/** Get a single shop by slug. */
export async function getShop(slug: string): Promise<ShopRead> {
  const response = await api.get<ShopRead>(`${API_ROUTES.SHOPS}/${slug}`);
  return response.data;
}

/** Follow a shop. */
export async function followShop(slug: string): Promise<void> {
  await api.post(API_ROUTES.SHOP.FOLLOW(slug));
}

/** Unfollow a shop. */
export async function unfollowShop(slug: string): Promise<void> {
  await api.delete(API_ROUTES.SHOP.FOLLOW(slug));
}
