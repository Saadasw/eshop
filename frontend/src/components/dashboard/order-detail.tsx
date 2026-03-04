/** Dashboard order detail with items, payment summary, timeline, and status actions. */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useShopOrder, useUpdateOrderStatus, useCancelShopOrder } from "@/hooks/use-shop-orders";
import { OrderStatusBadge } from "@/components/storefront/order-status-badge";
import { OrderTimeline } from "@/components/storefront/order-timeline";
import { ConfirmDialog } from "./confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/lib/utils/constants";
import { formatBDT, formatDateBST } from "@/lib/utils/format";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { OrderStatus } from "@/types/database";

/** Valid order status transitions (mirrors backend state machine). */
const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["ready", "cancelled"],
  ready: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const STATUS_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  confirmed: "Confirm Order",
  processing: "Start Processing",
  ready: "Mark Ready",
  shipped: "Mark Shipped",
  delivered: "Mark Delivered",
};

interface DashboardOrderDetailProps {
  slug: string;
  orderId: string;
}

export function DashboardOrderDetail({ slug, orderId }: DashboardOrderDetailProps) {
  /** Renders order detail with status update and cancel actions. */
  const { data: order, isLoading } = useShopOrder(slug, orderId);
  const updateStatus = useUpdateOrderStatus(slug);
  const cancelOrder = useCancelShopOrder(slug);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const handleStatusUpdate = (newStatus: OrderStatus) => {
    updateStatus.mutate(
      { orderId, data: { status: newStatus } },
      {
        onSuccess: () => toast.success(`Order updated to ${newStatus}`),
        onError: () => toast.error("Failed to update order status"),
      },
    );
  };

  const handleCancel = () => {
    cancelOrder.mutate(
      { orderId, data: { cancel_reason: cancelReason || undefined } },
      {
        onSuccess: () => {
          toast.success("Order cancelled");
          setCancelOpen(false);
          setCancelReason("");
        },
        onError: () => toast.error("Failed to cancel order"),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-60 w-full rounded-lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold">Order not found</h2>
        <p className="mt-1 text-muted-foreground">
          This order doesn&apos;t exist or has been deleted.
        </p>
      </div>
    );
  }

  const nextStatuses = VALID_ORDER_TRANSITIONS[order.status].filter(
    (s) => s !== "cancelled",
  );
  const canCancel = VALID_ORDER_TRANSITIONS[order.status].includes("cancelled");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href={ROUTES.DASHBOARD_ORDERS(slug)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{order.order_number}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Placed on {formatDateBST(order.ordered_at)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold">Items</h2>
              <Separator className="my-3" />
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.item_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.image_url_snapshot && (
                        <img
                          src={item.image_url_snapshot}
                          alt={item.product_name_snapshot}
                          className="h-12 w-12 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.product_name_snapshot}</p>
                        {item.variant_name_snapshot && (
                          <p className="text-sm text-muted-foreground">
                            {item.variant_name_snapshot}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {formatBDT(item.unit_price_snapshot)}
                        </p>
                      </div>
                    </div>
                    <span className="font-medium">{formatBDT(item.line_total)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold">Payment Summary</h2>
              <Separator className="my-3" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatBDT(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>{formatBDT(order.delivery_fee)}</span>
                </div>
                {parseFloat(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatBDT(order.discount_amount)}</span>
                  </div>
                )}
                {parseFloat(order.tax_amount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatBDT(order.tax_amount)}</span>
                  </div>
                )}
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatBDT(order.total_amount)}</span>
              </div>
              {order.coupon_code_snapshot && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Coupon applied: {order.coupon_code_snapshot}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Delivery info */}
          {order.delivery_address_snapshot && (
            <Card>
              <CardContent className="p-4">
                <h2 className="font-semibold">Delivery Address</h2>
                <Separator className="my-3" />
                <div className="text-sm text-muted-foreground">
                  {Object.values(order.delivery_address_snapshot)
                    .filter(Boolean)
                    .join(", ")}
                </div>
                {order.delivery_zone_name_snapshot && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Zone: {order.delivery_zone_name_snapshot}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Timeline + Actions */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-3 font-semibold">Status</h2>
              <OrderTimeline order={order} />
            </CardContent>
          </Card>

          {order.customer_note && (
            <Card>
              <CardContent className="p-4">
                <h2 className="font-semibold">Customer Note</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {order.customer_note}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Status update actions */}
          {nextStatuses.length > 0 && (
            <div className="space-y-2">
              {nextStatuses.map((status) => (
                <Button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updateStatus.isPending}
                  className="w-full"
                >
                  {updateStatus.isPending
                    ? "Updating..."
                    : STATUS_ACTION_LABELS[status] ?? `Move to ${status}`}
                </Button>
              ))}
            </div>
          )}

          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => setCancelOpen(true)}
              className="w-full"
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Cancel dialog */}
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Order"
        description="Are you sure you want to cancel this order? This will restore stock for all items."
        confirmLabel="Cancel Order"
        isPending={cancelOrder.isPending}
        onConfirm={handleCancel}
      >
        <div className="py-2">
          <Textarea
            placeholder="Reason for cancellation (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
