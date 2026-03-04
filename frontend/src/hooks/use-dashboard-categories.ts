/** TanStack Query hooks for category management (CRUD). */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCategories } from "@/lib/api/categories";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/api/dashboard-categories";
import type { CategoryCreate, CategoryUpdate } from "@/types/database";

/** Fetch all categories including inactive (for dashboard). */
export function useDashboardCategories(slug: string) {
  return useQuery({
    queryKey: ["categories", slug, "all"],
    queryFn: () => listCategories(slug, true),
    enabled: !!slug,
  });
}

/** Mutation to create a category. */
export function useCreateCategory(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CategoryCreate) => createCategory(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", slug] });
    },
  });
}

/** Mutation to update a category. */
export function useUpdateCategory(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: CategoryUpdate }) =>
      updateCategory(slug, categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", slug] });
    },
  });
}

/** Mutation to delete a category. */
export function useDeleteCategory(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => deleteCategory(slug, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", slug] });
    },
  });
}
