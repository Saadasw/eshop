/** Order status timeline showing progression through states. */

import { cn } from "@/lib/utils";
import { formatDateBST } from "@/lib/utils/format";
import { Check, Circle } from "lucide-react";
import type { OrderRead, OrderStatus } from "@/types/database";

const STATUS_STEPS: { key: OrderStatus; label: string; dateKey: keyof OrderRead }[] = [
  { key: "pending", label: "Order Placed", dateKey: "ordered_at" },
  { key: "confirmed", label: "Confirmed", dateKey: "confirmed_at" },
  { key: "processing", label: "Processing", dateKey: "processing_at" },
  { key: "ready", label: "Ready", dateKey: "ready_at" },
  { key: "shipped", label: "Shipped", dateKey: "shipped_at" },
  { key: "delivered", label: "Delivered", dateKey: "delivered_at" },
];

interface OrderTimelineProps {
  order: OrderRead;
}

export function OrderTimeline({ order }: OrderTimelineProps) {
  /** Renders a vertical timeline of order status progression. */
  if (order.status === "cancelled") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-destructive">
          <Circle className="h-4 w-4 fill-current" />
          <span className="font-medium">Order Cancelled</span>
        </div>
        {order.cancelled_at && (
          <p className="ml-6 text-sm text-muted-foreground">
            {formatDateBST(order.cancelled_at)}
          </p>
        )}
        {order.cancel_reason && (
          <p className="ml-6 text-sm text-muted-foreground">
            Reason: {order.cancel_reason}
          </p>
        )}
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="space-y-0">
      {STATUS_STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const dateValue = order[step.dateKey] as string | null;
        const isLast = index === STATUS_STEPS.length - 1;

        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : "border-2 border-muted-foreground/30",
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-2 w-2" />
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-6",
                    isCompleted && !isCurrent
                      ? "bg-primary"
                      : "bg-muted-foreground/20",
                  )}
                />
              )}
            </div>
            <div className={cn("pb-4", !isLast && "pb-4")}>
              <p
                className={cn(
                  "text-sm font-medium leading-6",
                  !isCompleted && "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              {dateValue && (
                <p className="text-xs text-muted-foreground">
                  {formatDateBST(dateValue)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
