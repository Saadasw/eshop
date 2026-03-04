/** Checkout page — address input, payment method (COD), and place order. */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { useCreateOrder } from "@/hooks/use-orders";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./empty-state";
import { formatBDT } from "@/lib/utils/format";
import { ROUTES } from "@/lib/utils/constants";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface CheckoutPageProps {
  slug: string;
}

export function CheckoutPage({ slug }: CheckoutPageProps) {
  /** Renders the checkout flow with address, payment method, and order placement. */
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: cart, isLoading: cartLoading } = useCart(slug);
  const createOrder = useCreateOrder(slug);
  const [customerNote, setCustomerNote] = useState("");

  const handlePlaceOrder = () => {
    createOrder.mutate(
      {
        fulfillment_type: "delivery",
        customer_note: customerNote || null,
      },
      {
        onSuccess: (order) => {
          toast.success("Order placed successfully!");
          router.push(ROUTES.ORDER_DETAIL(order.order_id));
        },
        onError: () => {
          toast.error("Failed to place order. Please try again.");
        },
      },
    );
  };

  if (authLoading || cartLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <EmptyState
        icon={<ShoppingCart className="h-12 w-12" />}
        title="Login to checkout"
        action={
          <Button asChild>
            <Link href={ROUTES.LOGIN}>Login</Link>
          </Button>
        }
      />
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="h-12 w-12" />}
        title="Your cart is empty"
        description="Add items to your cart before checking out."
        action={
          <Button asChild variant="outline">
            <Link href={ROUTES.SHOP(slug)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Browse Products
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items Summary */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold">
                Items ({cart.item_count})
              </h2>
              <Separator className="my-3" />
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div
                    key={item.cart_item_id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.product_name ?? ""}
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        {item.variant_name && (
                          <p className="text-muted-foreground">
                            {item.variant_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <span>
                      {item.quantity} x{" "}
                      {item.unit_price ? formatBDT(item.unit_price) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold">Payment Method</h2>
              <Separator className="my-3" />
              <div className="flex items-center gap-3 rounded-md border border-primary bg-primary/5 p-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="font-medium">Cash on Delivery (COD)</p>
                  <p className="text-sm text-muted-foreground">
                    Pay when you receive your order
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Note */}
          <Card>
            <CardContent className="p-4">
              <Label htmlFor="note">Order Note (optional)</Label>
              <Input
                id="note"
                placeholder="Any special instructions for your order..."
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Order Total */}
        <div>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold">Order Total</h3>
              <Separator className="my-3" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatBDT(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-muted-foreground">
                    Calculated by shop
                  </span>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatBDT(cart.subtotal)}</span>
              </div>
              <Button
                onClick={handlePlaceOrder}
                disabled={createOrder.isPending}
                className="mt-4 w-full"
              >
                {createOrder.isPending ? "Placing Order..." : "Place Order"}
              </Button>
              <Button asChild variant="ghost" className="mt-2 w-full">
                <Link href={ROUTES.CART(slug)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Cart
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
