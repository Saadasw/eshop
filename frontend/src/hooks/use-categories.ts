/** TanStack Query hook for category data. */

"use client";

import { useQuery } from "@tanstack/react-query";
import { listCategories } from "@/lib/api/categories";

/** Fetch all active categories for a shop. */
export function useCategories(slug: string) {
  return useQuery({
    queryKey: ["categories", slug],
    queryFn: () => listCategories(slug),
    enabled: !!slug,
  });
}
