/** Client component for the shop discovery page with pagination and skeleton loading. */

"use client";

import { useState } from "react";
import { useShops } from "@/hooks/use-shops";
import { ShopCard } from "./shop-card";
import { Pagination } from "./pagination";
import { EmptyState } from "./empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Store } from "lucide-react";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";

function ShopCardSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function ShopListPage() {
  /** Renders a paginated grid of shop cards with loading skeletons. */
  const [skip, setSkip] = useState(0);
  const { data, isLoading } = useShops({ skip, limit: DEFAULT_PAGE_SIZE });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Browse Shops</h1>
        <p className="mt-1 text-muted-foreground">
          Discover local shops in Khilgaon, Dhaka.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ShopCardSkeleton key={i} />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<Store className="h-12 w-12" />}
          title="No shops available"
          description="Check back later for new shops."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((shop) => (
              <ShopCard key={shop.shop_id} shop={shop} />
            ))}
          </div>
          <Pagination
            total={data.total}
            skip={skip}
            limit={DEFAULT_PAGE_SIZE}
            onChange={setSkip}
          />
        </>
      )}
    </div>
  );
}
