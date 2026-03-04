/** Add-to-cart button with quantity stepper and login dialog for guests. */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useAddToCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import Link from "next/link";
import { ROUTES } from "@/lib/utils/constants";

interface AddToCartButtonProps {
  shopSlug: string;
  variantId: string;
  stockQuantity: number;
}

export function AddToCartButton({
  shopSlug,
  variantId,
  stockQuantity,
}: AddToCartButtonProps) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const addToCart = useAddToCart(shopSlug);

  const outOfStock = stockQuantity <= 0;

  const handleAdd = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    addToCart.mutate(
      { variant_id: variantId, quantity },
      {
        onSuccess: () => toast.success("Added to cart"),
        onError: () => toast.error("Failed to add to cart"),
      },
    );
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-md border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-10 text-center text-sm font-medium">
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuantity((q) => Math.min(stockQuantity, q + 1))}
            disabled={quantity >= stockQuantity}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={handleAdd}
          disabled={outOfStock || addToCart.isPending}
          className="flex-1"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {outOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              Please log in or create an account to add items to your cart.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button asChild className="flex-1">
              <Link href={ROUTES.LOGIN}>Login</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href={ROUTES.REGISTER}>Register</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
