/** Wishlist page showing saved products. */

"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useWishlist, useRemoveFromWishlist } from "@/hooks/use-wishlist";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./empty-state";
import { PriceDisplay } from "./price-display";
import { Pagination } from "./pagination";
import { Heart, Trash2 } from "lucide-react";
import { ROUTES, DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";
import Link from "next/link";
import { toast } from "sonner";

export function WishlistPage() {
  /** Renders a paginated list of wishlisted products with remove action. */
  const { user, isLoading: authLoading } = useAuth();
  const [skip, setSkip] = useState(0);
  const { data, isLoading } = useWishlist({ skip, limit: DEFAULT_PAGE_SIZE }, !!user);
  const removeFromWishlist = useRemoveFromWishlist();

  if (authLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <EmptyState
        icon={<Heart className="h-12 w-12" />}
        title="Login to view your wishlist"
        action={
          <Button asChild>
            <Link href={ROUTES.LOGIN}>Login</Link>
          </Button>
        }
      />
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="h-12 w-12" />}
        title="Your wishlist is empty"
        description="Browse shops and save products you like."
        action={
          <Button asChild variant="outline">
            <Link href={ROUTES.SHOPS}>Browse Shops</Link>
          </Button>
        }
      />
    );
  }

  const handleRemove = (wishlistId: string) => {
    removeFromWishlist.mutate(wishlistId, {
      onSuccess: () => toast.success("Removed from wishlist"),
      onError: () => toast.error("Failed to remove"),
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Wishlist</h1>
      <div className="space-y-3">
        {data.items.map((item) => (
          <Card key={item.wishlist_id}>
            <CardContent className="flex items-center gap-4 p-4">
              {item.product_image && (
                <img
                  src={item.product_image}
                  alt={item.product_name ?? ""}
                  className="h-16 w-16 rounded object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/${item.shop_id}/products/${item.product_id}`}
                  className="font-medium hover:underline truncate block"
                >
                  {item.product_name ?? "Unknown product"}
                </Link>
                <PriceDisplay
                  price={item.min_price ?? "0"}
                  minPrice={item.min_price}
                  maxPrice={item.max_price}
                />
                {!item.is_active && (
                  <span className="text-xs text-red-500">Unavailable</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(item.wishlist_id)}
                disabled={removeFromWishlist.isPending}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {data.total > DEFAULT_PAGE_SIZE && (
        <Pagination
          total={data.total}
          skip={data.skip}
          limit={data.limit}
          onChange={setSkip}
        />
      )}
    </div>
  );
}
