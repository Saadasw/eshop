/** Single cart item row with image, name, price, quantity controls, and remove. */

"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatBDT } from "@/lib/utils/format";
import { useUpdateCartItem, useRemoveCartItem } from "@/hooks/use-cart";
import type { CartItemRead } from "@/types/database";

interface CartItemProps {
  item: CartItemRead;
  shopSlug: string;
}

export function CartItem({ item, shopSlug }: CartItemProps) {
  /** Renders a cart item with quantity controls and remove button. */
  const updateItem = useUpdateCartItem(shopSlug);
  const removeItem = useRemoveCartItem(shopSlug);

  const maxQty = item.stock_quantity ?? 99;
  const lineTotal =
    item.unit_price ? parseFloat(item.unit_price) * item.quantity : 0;

  return (
    <div className="flex gap-4 py-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.product_name ?? "Product"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="font-medium leading-tight">
            {item.product_name ?? "Unknown Product"}
          </h3>
          {item.variant_name && (
            <p className="text-sm text-muted-foreground">
              {item.variant_name}
            </p>
          )}
          {item.unit_price && (
            <p className="mt-0.5 text-sm">{formatBDT(item.unit_price)} each</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                updateItem.mutate({
                  itemId: item.cart_item_id,
                  quantity: item.quantity - 1,
                })
              }
              disabled={item.quantity <= 1 || updateItem.isPending}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                updateItem.mutate({
                  itemId: item.cart_item_id,
                  quantity: item.quantity + 1,
                })
              }
              disabled={item.quantity >= maxQty || updateItem.isPending}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold">{formatBDT(lineTotal)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => removeItem.mutate(item.cart_item_id)}
              disabled={removeItem.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
