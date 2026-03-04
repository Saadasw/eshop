/** Shop header with banner, logo avatar, name, description, and rating. */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingStars } from "./rating-stars";
import type { ShopRead } from "@/types/database";

interface ShopHeaderProps {
  shop: ShopRead;
}

export function ShopHeader({ shop }: ShopHeaderProps) {
  /** Renders the top banner and shop info section of a storefront. */
  const initials = shop.shop_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      {shop.banner_url && (
        <div className="h-40 overflow-hidden rounded-lg sm:h-56">
          <img
            src={shop.banner_url}
            alt={`${shop.shop_name} banner`}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex items-start gap-4 px-1 pt-4">
        <Avatar className="h-16 w-16 border-2 border-background shadow sm:h-20 sm:w-20">
          <AvatarImage src={shop.logo_url ?? undefined} alt={shop.shop_name} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold sm:text-2xl">{shop.shop_name}</h1>
          {shop.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {shop.description}
            </p>
          )}
          <div className="mt-2">
            <RatingStars rating={shop.avg_rating} size="md" />
          </div>
        </div>
      </div>
    </div>
  );
}
