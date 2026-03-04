/** Cart page client component with item list, summary, and clear action. */

"use client";

import { useCart, useClearCart } from "@/hooks/use-cart";
import { useAuth } from "@/providers/auth-provider";
import { CartItem } from "./cart-item";
import { CartSummary } from "./cart-summary";
import { EmptyState } from "./empty-state";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/utils/constants";

interface CartPageProps {
  slug: string;
}

export function CartPage({ slug }: CartPageProps) {
  /** Renders the full cart page with items, summary, and actions. */
  const { user, isLoading: authLoading } = useAuth();
  const { data: cart, isLoading } = useCart(slug);
  const clearCart = useClearCart(slug);

  if (authLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-20 w-20 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <EmptyState
        icon={<ShoppingCart className="h-12 w-12" />}
        title="Login to view your cart"
        description="You need to be logged in to add items and view your cart."
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
        description="Browse products and add items to your cart."
        action={
          <Button asChild variant="outline">
            <Link href={ROUTES.SHOP(slug)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => clearCart.mutate()}
          disabled={clearCart.isPending}
        >
          Clear Cart
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="divide-y">
            {cart.items.map((item) => (
              <CartItem
                key={item.cart_item_id}
                item={item}
                shopSlug={slug}
              />
            ))}
          </div>
          <Separator className="mt-4" />
          <div className="mt-4">
            <Button asChild variant="ghost">
              <Link href={ROUTES.SHOP(slug)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>

        <div>
          <CartSummary
            subtotal={cart.subtotal}
            itemCount={cart.item_count}
            shopSlug={slug}
          />
        </div>
      </div>
    </div>
  );
}
