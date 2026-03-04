/** TanStack Query hooks for product management (CRUD, variants, media). */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  uploadMedia,
  deleteMedia,
  setPrimaryMedia,
} from "@/lib/api/dashboard-products";
import type {
  ProductCreate,
  ProductUpdate,
  VariantCreate,
  VariantUpdate,
} from "@/types/database";

/** Mutation to create a product. */
export function useCreateProduct(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductCreate) => createProduct(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", slug] });
    },
  });
}

/** Mutation to update a product. */
export function useUpdateProduct(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: ProductUpdate }) =>
      updateProduct(slug, productId, data),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["product", slug, productId] });
      queryClient.invalidateQueries({ queryKey: ["products", slug] });
    },
  });
}

/** Mutation to delete a product. */
export function useDeleteProduct(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => deleteProduct(slug, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", slug] });
    },
  });
}

/** Mutation to add a variant. */
export function useCreateVariant(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: VariantCreate }) =>
      createVariant(slug, productId, data),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["product", slug, productId] });
    },
  });
}

/** Mutation to update a variant. */
export function useUpdateVariant(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      variantId,
      data,
    }: {
      productId: string;
      variantId: string;
      data: VariantUpdate;
    }) => updateVariant(slug, productId, variantId, data),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["product", slug, productId] });
    },
  });
}

/** Mutation to delete a variant. */
export function useDeleteVariant(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, variantId }: { productId: string; variantId: string }) =>
      deleteVariant(slug, productId, variantId),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["product", slug, productId] });
    },
  });
}

/** Mutation to upload product media. */
export function useUploadMedia(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      file,
      altText,
      isPrimary,
    }: {
      productId: string;
      file: File;
      altText?: string;
      isPrimary?: boolean;
    }) => uploadMedia(slug, productId, file, altText, isPrimary),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["product", slug, productId] });
    },
  });
}

/** Mutation to delete product media. */
export function useDeleteMedia(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, mediaId }: { productId: string; mediaId: string }) =>
      deleteMedia(slug, productId, mediaId),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["product", slug, productId] });
    },
  });
}

/** Mutation to set primary media. */
export function useSetPrimaryMedia(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, mediaId }: { productId: string; mediaId: string }) =>
      setPrimaryMedia(slug, productId, mediaId),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["product", slug, productId] });
    },
  });
}
