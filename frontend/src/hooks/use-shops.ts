/** TanStack Query hooks for shop data. */

"use client";

import { useQuery } from "@tanstack/react-query";
import { listShops, getShop, type ShopListParams } from "@/lib/api/shops";

/** Fetch paginated list of shops. */
export function useShops(params?: ShopListParams) {
  return useQuery({
    queryKey: ["shops", params],
    queryFn: () => listShops(params),
  });
}

/** Fetch a single shop by slug. */
export function useShop(slug: string) {
  return useQuery({
    queryKey: ["shop", slug],
    queryFn: () => getShop(slug),
    enabled: !!slug,
  });
}
