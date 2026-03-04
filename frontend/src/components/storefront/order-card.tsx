/** Order summary card for the order history list. */

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "./order-status-badge";
import { formatBDT } from "@/lib/utils/format";
import { formatDateBST } from "@/lib/utils/format";
import { ROUTES } from "@/lib/utils/constants";
import type { OrderSummaryRead } from "@/types/database";

interface OrderCardProps {
  order: OrderSummaryRead;
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Link href={ROUTES.ORDER_DETAIL(order.order_id)}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{order.order_number}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDateBST(order.ordered_at)} · {order.item_count} item
              {order.item_count !== 1 ? "s" : ""}
            </p>
          </div>
          <span className="font-semibold">{formatBDT(order.total_amount)}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
