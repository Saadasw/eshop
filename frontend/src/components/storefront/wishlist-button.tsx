/** Heart button to add/remove a product from the wishlist. */

"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/hooks/use-wishlist";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  shopId: string;
  className?: string;
}

export function WishlistButton({ productId, shopId, className }: WishlistButtonProps) {
  /** Renders a heart icon that toggles wishlist status for the product. */
  const { user } = useAuth();
  const { data: wishlist } = useWishlist(undefined, !!user);
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const wishlistItem = wishlist?.items.find(
    (item) => item.product_id === productId,
  );
  const isWishlisted = !!wishlistItem;

  const handleToggle = () => {
    if (!user) {
      toast.error("Please login to save to wishlist");
      return;
    }

    if (isWishlisted && wishlistItem) {
      removeFromWishlist.mutate(wishlistItem.wishlist_id, {
        onSuccess: () => toast.success("Removed from wishlist"),
        onError: () => toast.error("Failed to update wishlist"),
      });
    } else {
      addToWishlist.mutate(
        { product_id: productId, shop_id: shopId },
        {
          onSuccess: () => toast.success("Added to wishlist"),
          onError: () => toast.error("Failed to update wishlist"),
        },
      );
    }
  };

  const isPending = addToWishlist.isPending || removeFromWishlist.isPending;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isPending}
      className={cn("shrink-0", className)}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-colors",
          isWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground",
        )}
      />
    </Button>
  );
}
