/** Dashboard order list with status filter, table, and pagination. */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useShopOrders } from "@/hooks/use-shop-orders";
import { OrderStatusBadge } from "@/components/storefront/order-status-badge";
import { Pagination } from "@/components/storefront/pagination";
import { EmptyState } from "@/components/storefront/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES, DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";
import { formatBDT, formatDateBST } from "@/lib/utils/format";
import { ShoppingBag } from "lucide-react";
import type { OrderStatus } from "@/types/database";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "ready", label: "Ready" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

interface DashboardOrderListProps {
  slug: string;
}

export function DashboardOrderList({ slug }: DashboardOrderListProps) {
  /** Renders orders table with status filter and pagination. */
  const [statusFilter, setStatusFilter] = useState("all");
  const [skip, setSkip] = useState(0);

  const { data, isLoading } = useShopOrders(slug, {
    skip,
    limit: DEFAULT_PAGE_SIZE,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setSkip(0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-12 w-12" />}
          title="No orders yet"
          description="Orders will appear here when customers place them."
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((order) => (
                  <TableRow key={order.order_id}>
                    <TableCell>
                      <Link
                        href={ROUTES.DASHBOARD_ORDER_DETAIL(slug, order.order_id)}
                        className="font-medium text-primary hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateBST(order.ordered_at)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="capitalize">
                      {order.payment_status.replace("_", " ")}
                    </TableCell>
                    <TableCell>{order.item_count}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatBDT(order.total_amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
