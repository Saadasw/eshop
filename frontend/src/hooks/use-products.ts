/** TanStack Query hooks for product data. */

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  listProducts,
  getProduct,
  type ProductListParams,
} from "@/lib/api/products";

/** Fetch paginated products for a shop with filters. */
export function useProducts(slug: string, params?: ProductListParams) {
  return useQuery({
    queryKey: ["products", slug, params],
    queryFn: () => listProducts(slug, params),
    enabled: !!slug,
  });
}

/** Fetch a single product by ID within a shop. */
export function useProduct(slug: string, productId: string) {
  return useQuery({
    queryKey: ["product", slug, productId],
    queryFn: () => getProduct(slug, productId),
    enabled: !!slug && !!productId,
  });
}
