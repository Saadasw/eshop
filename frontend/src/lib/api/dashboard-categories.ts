/** Typed API wrappers for category management (create, update, delete). */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type {
  CategoryRead,
  CategoryCreate,
  CategoryUpdate,
} from "@/types/database";

/** Create a category in a shop. */
export async function createCategory(
  slug: string,
  data: CategoryCreate,
): Promise<CategoryRead> {
  const response = await api.post<CategoryRead>(
    API_ROUTES.SHOP.CATEGORIES(slug),
    data,
  );
  return response.data;
}

/** Update a category. */
export async function updateCategory(
  slug: string,
  categoryId: string,
  data: CategoryUpdate,
): Promise<CategoryRead> {
  const response = await api.patch<CategoryRead>(
    API_ROUTES.SHOP.CATEGORY(slug, categoryId),
    data,
  );
  return response.data;
}

/** Soft-delete a category. */
export async function deleteCategory(
  slug: string,
  categoryId: string,
): Promise<void> {
  await api.delete(API_ROUTES.SHOP.CATEGORY(slug, categoryId));
}
