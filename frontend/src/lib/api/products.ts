/** Typed API wrappers for product endpoints. */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type { PaginatedResponse, ProductRead } from "@/types/database";

export interface ProductListParams {
  skip?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  sort?: string;
  is_featured?: boolean;
  is_new?: boolean;
  is_active?: boolean;
}

/** List products for a shop with filters and pagination. */
export async function listProducts(
  slug: string,
  params?: ProductListParams,
): Promise<PaginatedResponse<ProductRead>> {
  const response = await api.get<PaginatedResponse<ProductRead>>(
    API_ROUTES.SHOP.PRODUCTS(slug),
    { params },
  );
  return response.data;
}

/** Get a single product by ID within a shop. */
export async function getProduct(
  slug: string,
  productId: string,
): Promise<ProductRead> {
  const response = await api.get<ProductRead>(
    API_ROUTES.SHOP.PRODUCT(slug, productId),
  );
  return response.data;
}
