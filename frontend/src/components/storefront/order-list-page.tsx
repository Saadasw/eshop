/** Order history page showing all user orders across shops. */

"use client";

import { useState } from "react";
import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/providers/auth-provider";
import { OrderCard } from "./order-card";
import { Pagination } from "./pagination";
import { EmptyState } from "./empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { ROUTES, DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";

export function OrderListPage() {
  /** Renders a paginated list of the user's orders. */
  const { user, isLoading: authLoading } = useAuth();
  const [skip, setSkip] = useState(0);
  const { data, isLoading } = useOrders({ skip, limit: DEFAULT_PAGE_SIZE });

  if (authLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-12 w-12" />}
        title="Login to view your orders"
        action={
          <Button asChild>
            <Link href={ROUTES.LOGIN}>Login</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {!data || data.items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-12 w-12" />}
          title="No orders yet"
          description="Your order history will appear here."
          action={
            <Button asChild variant="outline">
              <Link href={ROUTES.SHOPS}>Browse Shops</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((order) => (
              <OrderCard key={order.order_id} order={order} />
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
