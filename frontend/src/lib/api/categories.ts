/** Typed API wrappers for category endpoints. */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type { CategoryRead } from "@/types/database";

/** List categories for a shop. Pass include_inactive=true for dashboard. */
export async function listCategories(
  slug: string,
  includeInactive?: boolean,
): Promise<CategoryRead[]> {
  const response = await api.get<CategoryRead[]>(
    API_ROUTES.SHOP.CATEGORIES(slug),
    { params: includeInactive ? { include_inactive: true } : undefined },
  );
  return response.data;
}
