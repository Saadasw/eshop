/** Shop card for the shop discovery grid. */

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingStars } from "./rating-stars";
import { ROUTES } from "@/lib/utils/constants";
import type { ShopRead } from "@/types/database";

interface ShopCardProps {
  shop: ShopRead;
}

export function ShopCard({ shop }: ShopCardProps) {
  /** Renders a shop card with logo, name, description, and rating. */
  const initials = shop.shop_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link href={ROUTES.SHOP(shop.slug)}>
      <Card className="h-full transition-shadow hover:shadow-md">
        {shop.banner_url && (
          <div className="h-28 overflow-hidden rounded-t-lg">
            <img
              src={shop.banner_url}
              alt={`${shop.shop_name} banner`}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <CardContent className="flex items-start gap-3 p-4">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={shop.logo_url ?? undefined} alt={shop.shop_name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{shop.shop_name}</h3>
            {shop.description && (
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                {shop.description}
              </p>
            )}
            <div className="mt-2">
              <RatingStars rating={shop.avg_rating} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
