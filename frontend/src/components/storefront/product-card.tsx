/** Product card for the product grid. */

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "./rating-stars";
import { PriceDisplay } from "./price-display";
import { ROUTES } from "@/lib/utils/constants";
import type { ProductRead } from "@/types/database";

interface ProductCardProps {
  product: ProductRead;
  shopSlug: string;
}

export function ProductCard({ product, shopSlug }: ProductCardProps) {
  /** Renders a product card with image, name, price, rating, and badges. */
  const primaryImage = product.media.find((m) => m.is_primary) ?? product.media[0];

  return (
    <Link href={ROUTES.PRODUCT(shopSlug, product.product_id)}>
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {primaryImage ? (
            <img
              src={primaryImage.file_url}
              alt={primaryImage.alt_text ?? product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          <div className="absolute left-2 top-2 flex gap-1">
            {product.is_new && <Badge variant="default">New</Badge>}
            {product.is_featured && (
              <Badge variant="secondary">Featured</Badge>
            )}
          </div>
        </div>
        <CardContent className="p-3">
          {product.brand && (
            <p className="text-xs text-muted-foreground">{product.brand}</p>
          )}
          <h3 className="mt-0.5 line-clamp-2 text-sm font-medium">
            {product.name}
          </h3>
          <div className="mt-1.5">
            <PriceDisplay
              price={product.base_price}
              compareAtPrice={product.compare_at_price}
              minPrice={product.min_price}
              maxPrice={product.max_price}
            />
          </div>
          {product.review_count > 0 && (
            <div className="mt-1.5">
              <RatingStars
                rating={product.avg_rating}
                reviewCount={product.review_count}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
