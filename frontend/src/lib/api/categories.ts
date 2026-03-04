/** Typed API wrappers for category endpoints. */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type { CategoryRead } from "@/types/database";

/** List all active categories for a shop. */
export async function listCategories(slug: string): Promise<CategoryRead[]> {
  const response = await api.get<CategoryRead[]>(
    API_ROUTES.SHOP.CATEGORIES(slug),
  );
  return response.data;
}
