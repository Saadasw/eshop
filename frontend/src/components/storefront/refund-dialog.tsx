/** Dialog for requesting a refund on a delivered order. */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useRequestRefund } from "@/hooks/use-refunds";
import type { OrderRead, OrderItemRead } from "@/types/database";
import { toast } from "sonner";

interface RefundDialogProps {
  order: OrderRead;
}

export function RefundDialog({ order }: RefundDialogProps) {
  /** Renders a dialog to select items and submit a refund request. */
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [itemQuantities, setItemQuantities] = useState<
    Record<string, number>
  >({});
  const requestRefund = useRequestRefund();

  const handleQuantityChange = (itemId: string, qty: number, max: number) => {
    if (qty <= 0) {
      const next = { ...itemQuantities };
      delete next[itemId];
      setItemQuantities(next);
    } else {
      setItemQuantities((prev) => ({
        ...prev,
        [itemId]: Math.min(qty, max),
      }));
    }
  };

  const selectedItems = Object.entries(itemQuantities).filter(
    ([, qty]) => qty > 0,
  );

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the refund");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to refund");
      return;
    }

    requestRefund.mutate(
      {
        orderId: order.order_id,
        data: {
          reason: reason.trim(),
          items: selectedItems.map(([itemId, qty]) => ({
            order_item_id: itemId,
            quantity: qty,
          })),
        },
      },
      {
        onSuccess: () => {
          toast.success("Refund request submitted");
          setOpen(false);
          setReason("");
          setItemQuantities({});
        },
        onError: () => toast.error("Failed to submit refund request"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Request Refund</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Refund</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Select items to refund</Label>
            <div className="mt-2 space-y-3">
              {order.items.map((item: OrderItemRead) => (
                <div
                  key={item.item_id}
                  className="flex items-center justify-between rounded border p-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.product_name_snapshot}
                    </p>
                    {item.variant_name_snapshot && (
                      <p className="text-xs text-muted-foreground">
                        {item.variant_name_snapshot}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Max: {item.quantity}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={item.quantity}
                    value={itemQuantities[item.item_id] ?? 0}
                    onChange={(e) =>
                      handleQuantityChange(
                        item.item_id,
                        parseInt(e.target.value) || 0,
                        item.quantity,
                      )
                    }
                    className="w-20"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="refund-reason">Reason</Label>
            <Textarea
              id="refund-reason"
              placeholder="Why are you requesting a refund?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={requestRefund.isPending || selectedItems.length === 0}
            className="w-full"
          >
            {requestRefund.isPending ? "Submitting..." : "Submit Refund Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
