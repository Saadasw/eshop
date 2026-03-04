/** Dashboard home with welcome card, summary stats, and quick action links. */

"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useShop } from "@/hooks/use-shops";
import { useProducts } from "@/hooks/use-products";
import { useShopOrders } from "@/hooks/use-shop-orders";
import { ROUTES } from "@/lib/utils/constants";
import { formatBDT } from "@/lib/utils/format";
import { ShoppingBag, Package, Plus, ArrowRight } from "lucide-react";

interface DashboardHomeProps {
  slug: string;
}

export function DashboardHome({ slug }: DashboardHomeProps) {
  /** Renders dashboard overview with stats and quick actions. */
  const { data: shop } = useShop(slug);
  const { data: products, isLoading: productsLoading } = useProducts(slug, {
    limit: 1,
  });
  const { data: orders, isLoading: ordersLoading } = useShopOrders(slug, {
    limit: 5,
  });

  const recentOrders = orders?.items ?? [];
  const totalRevenue = recentOrders.reduce(
    (sum, o) => sum + parseFloat(o.total_amount),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{shop ? `, ${shop.shop_name}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Manage your shop, products, and orders from here.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{products?.total ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{orders?.total ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Revenue
            </CardTitle>
            <span className="text-sm text-muted-foreground">৳</span>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatBDT(totalRevenue)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={ROUTES.DASHBOARD_PRODUCT_NEW(slug)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={ROUTES.DASHBOARD_ORDERS(slug)}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              View Orders
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={ROUTES.DASHBOARD_SETTINGS(slug)}>
              Manage Settings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent orders preview */}
      {recentOrders.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={ROUTES.DASHBOARD_ORDERS(slug)}>
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.order_id}
                  href={ROUTES.DASHBOARD_ORDER_DETAIL(slug, order.order_id)}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <span className="font-medium">{order.order_number}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {order.item_count} item{order.item_count > 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="font-medium">
                    {formatBDT(order.total_amount)}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
