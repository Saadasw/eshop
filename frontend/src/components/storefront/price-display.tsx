/** Price display with strikethrough compare-at price or min-max range. */

import { formatBDT } from "@/lib/utils/format";

interface PriceDisplayProps {
  price: string;
  compareAtPrice?: string | null;
  minPrice?: string | null;
  maxPrice?: string | null;
}

export function PriceDisplay({
  price,
  compareAtPrice,
  minPrice,
  maxPrice,
}: PriceDisplayProps) {
  const hasRange =
    minPrice && maxPrice && minPrice !== maxPrice;
  const hasDiscount =
    compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price);

  if (hasRange) {
    return (
      <div className="flex items-baseline gap-1">
        <span className="font-semibold">{formatBDT(minPrice)}</span>
        <span className="text-muted-foreground">–</span>
        <span className="font-semibold">{formatBDT(maxPrice)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-2">
      <span className="font-semibold">{formatBDT(price)}</span>
      {hasDiscount && (
        <span className="text-sm text-muted-foreground line-through">
          {formatBDT(compareAtPrice)}
        </span>
      )}
    </div>
  );
}
