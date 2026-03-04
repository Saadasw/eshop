/** Main shop storefront page with filter state in URL search params. */

"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useShop } from "@/hooks/use-shops";
import { useProducts } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { ShopHeader } from "./shop-header";
import { ProductFilters } from "./product-filters";
import { ProductGrid } from "./product-grid";
import { Pagination } from "./pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";

function ShopStorefrontInner({ slug }: { slug: string }) {
  /** Inner component that uses useSearchParams (requires Suspense boundary). */
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const categoryId = searchParams.get("category") ?? null;
  const skip = parseInt(searchParams.get("skip") ?? "0", 10);

  const setParam = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const { data: shop, isLoading: shopLoading } = useShop(slug);
  const { data: categories } = useCategories(slug);
  const { data: productsData, isLoading: productsLoading } = useProducts(
    slug,
    {
      skip,
      limit: DEFAULT_PAGE_SIZE,
      search: search || undefined,
      sort: sort || undefined,
      category_id: categoryId ?? undefined,
    },
  );

  if (shopLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-lg sm:h-56" />
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full sm:h-20 sm:w-20" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold">Shop not found</h2>
        <p className="mt-1 text-muted-foreground">
          This shop doesn&apos;t exist or is not available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ShopHeader shop={shop} />

      <ProductFilters
        search={search}
        onSearchChange={(v) => setParam({ search: v, skip: null })}
        sort={sort}
        onSortChange={(v) => setParam({ sort: v, skip: null })}
        categories={categories ?? []}
        selectedCategoryId={categoryId}
        onCategoryChange={(id) => setParam({ category: id, skip: null })}
      />

      {productsLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <ProductGrid
            products={productsData?.items ?? []}
            shopSlug={slug}
          />
          {productsData && (
            <Pagination
              total={productsData.total}
              skip={skip}
              limit={DEFAULT_PAGE_SIZE}
              onChange={(newSkip) => setParam({ skip: String(newSkip) })}
            />
          )}
        </>
      )}
    </div>
  );
}

export function ShopStorefront({ slug }: { slug: string }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-lg sm:h-56" />
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-full sm:h-20 sm:w-20" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          </div>
        </div>
      }
    >
      <ShopStorefrontInner slug={slug} />
    </Suspense>
  );
}
