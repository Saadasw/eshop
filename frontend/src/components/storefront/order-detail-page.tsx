/** Order detail page showing items, timeline, and order info. */

"use client";

import { useOrder, useCancelOrder } from "@/hooks/use-orders";
import { OrderStatusBadge } from "./order-status-badge";
import { OrderTimeline } from "./order-timeline";
import { RefundDialog } from "./refund-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBDT, formatDateBST } from "@/lib/utils/format";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/utils/constants";
import { toast } from "sonner";

interface OrderDetailPageProps {
  orderId: string;
}

export function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  /** Renders full order detail with items, timeline, and cancel action. */
  const { data: order, isLoading } = useOrder(orderId);
  const cancelOrder = useCancelOrder();

  const handleCancel = () => {
    cancelOrder.mutate(
      { orderId },
      {
        onSuccess: () => toast.success("Order cancelled"),
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
          This order doesn&apos;t exist or you don&apos;t have access.
        </p>
      </div>
    );
  }

  const canCancel = ["pending", "confirmed"].includes(order.status);
  const canRefund = ["delivered", "shipped"].includes(order.status);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href={ROUTES.ORDERS}>
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
          {/* Order Items */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold">Items</h2>
              <Separator className="my-3" />
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.item_id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {item.image_url_snapshot && (
                        <img
                          src={item.image_url_snapshot}
                          alt={item.product_name_snapshot}
                          className="h-12 w-12 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">
                          {item.product_name_snapshot}
                        </p>
                        {item.variant_name_snapshot && (
                          <p className="text-sm text-muted-foreground">
                            {item.variant_name_snapshot}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x{" "}
                          {formatBDT(item.unit_price_snapshot)}
                        </p>
                      </div>
                    </div>
                    <span className="font-medium">
                      {formatBDT(item.line_total)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
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
        </div>

        {/* Timeline + Actions */}
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
                <h2 className="font-semibold">Your Note</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {order.customer_note}
                </p>
              </CardContent>
            </Card>
          )}

          {canRefund && <RefundDialog order={order} />}

          {canCancel && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelOrder.isPending}
              className="w-full"
            >
              {cancelOrder.isPending ? "Cancelling..." : "Cancel Order"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
