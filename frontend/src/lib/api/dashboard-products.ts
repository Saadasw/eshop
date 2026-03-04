/** Typed API wrappers for product management (create, update, delete, variants, media). */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type {
  ProductRead,
  ProductCreate,
  ProductUpdate,
  VariantRead,
  VariantCreate,
  VariantUpdate,
  ProductMediaRead,
} from "@/types/database";

/** Create a new product in a shop. */
export async function createProduct(
  slug: string,
  data: ProductCreate,
): Promise<ProductRead> {
  const response = await api.post<ProductRead>(
    API_ROUTES.SHOP.PRODUCTS(slug),
    data,
  );
  return response.data;
}

/** Update a product. */
export async function updateProduct(
  slug: string,
  productId: string,
  data: ProductUpdate,
): Promise<ProductRead> {
  const response = await api.patch<ProductRead>(
    API_ROUTES.SHOP.PRODUCT(slug, productId),
    data,
  );
  return response.data;
}

/** Soft-delete a product. */
export async function deleteProduct(
  slug: string,
  productId: string,
): Promise<void> {
  await api.delete(API_ROUTES.SHOP.PRODUCT(slug, productId));
}

// --- Variants ---

/** Add a variant to a product. */
export async function createVariant(
  slug: string,
  productId: string,
  data: VariantCreate,
): Promise<VariantRead> {
  const response = await api.post<VariantRead>(
    API_ROUTES.SHOP.PRODUCT_VARIANTS(slug, productId),
    data,
  );
  return response.data;
}

/** Update a variant. */
export async function updateVariant(
  slug: string,
  productId: string,
  variantId: string,
  data: VariantUpdate,
): Promise<VariantRead> {
  const response = await api.patch<VariantRead>(
    API_ROUTES.SHOP.PRODUCT_VARIANT(slug, productId, variantId),
    data,
  );
  return response.data;
}

/** Soft-delete a variant. */
export async function deleteVariant(
  slug: string,
  productId: string,
  variantId: string,
): Promise<void> {
  await api.delete(API_ROUTES.SHOP.PRODUCT_VARIANT(slug, productId, variantId));
}

// --- Media ---

/** Upload a product image. */
export async function uploadMedia(
  slug: string,
  productId: string,
  file: File,
  altText?: string,
  isPrimary?: boolean,
): Promise<ProductMediaRead> {
  const formData = new FormData();
  formData.append("file", file);
  if (altText) formData.append("alt_text", altText);
  if (isPrimary) formData.append("is_primary", "true");

  const response = await api.post<ProductMediaRead>(
    API_ROUTES.SHOP.PRODUCT_MEDIA(slug, productId),
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
}

/** Delete a product media item. */
export async function deleteMedia(
  slug: string,
  productId: string,
  mediaId: string,
): Promise<void> {
  await api.delete(
    API_ROUTES.SHOP.PRODUCT_MEDIA_ITEM(slug, productId, mediaId),
  );
}

/** Set a media item as primary. */
export async function setPrimaryMedia(
  slug: string,
  productId: string,
  mediaId: string,
): Promise<ProductMediaRead> {
  const response = await api.patch<ProductMediaRead>(
    API_ROUTES.SHOP.PRODUCT_MEDIA_PRIMARY(slug, productId, mediaId),
  );
  return response.data;
}
