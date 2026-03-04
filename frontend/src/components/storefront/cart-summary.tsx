/** Cart summary showing subtotal and checkout button. */

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatBDT } from "@/lib/utils/format";
import Link from "next/link";
import { ROUTES } from "@/lib/utils/constants";

interface CartSummaryProps {
  subtotal: string;
  itemCount: number;
  shopSlug: string;
}

export function CartSummary({
  subtotal,
  itemCount,
  shopSlug,
}: CartSummaryProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">Order Summary</h3>
      <Separator className="my-3" />
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Subtotal ({itemCount} items)
          </span>
          <span>{formatBDT(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Delivery</span>
          <span className="text-muted-foreground">Calculated at checkout</span>
        </div>
      </div>
      <Separator className="my-3" />
      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span>{formatBDT(subtotal)}</span>
      </div>
      <Button asChild className="mt-4 w-full">
        <Link href={ROUTES.CHECKOUT(shopSlug)}>Proceed to Checkout</Link>
      </Button>
    </div>
  );
}
