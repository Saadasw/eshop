/** Admin dashboard home with platform stats. */

"use client";

import { useAdminStats } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Users, ShoppingBag, TrendingUp } from "lucide-react";
import { formatBDT } from "@/lib/utils/format";

export function AdminDashboard() {
  /** Renders platform-wide stats cards. */
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: "Total Users",
      value: stats.total_users.toLocaleString(),
      icon: Users,
    },
    {
      title: "Total Shops",
      value: stats.total_shops.toLocaleString(),
      icon: Store,
    },
    {
      title: "Pending Shops",
      value: stats.pending_shops.toLocaleString(),
      icon: Store,
      highlight: stats.pending_shops > 0,
    },
    {
      title: "Active Shops",
      value: stats.active_shops.toLocaleString(),
      icon: Store,
    },
    {
      title: "Total Orders",
      value: stats.total_orders.toLocaleString(),
      icon: ShoppingBag,
    },
    {
      title: "Total Revenue",
      value: formatBDT(stats.total_revenue.toString()),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${card.highlight ? "text-orange-600" : ""}`}
              >
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
