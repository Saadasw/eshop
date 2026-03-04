/** Star rating display with optional review count. */

import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number | string;
  reviewCount?: number;
  size?: "sm" | "md";
}

export function RatingStars({
  rating,
  reviewCount,
  size = "sm",
}: RatingStarsProps) {
  const numRating =
    typeof rating === "string" ? parseFloat(rating) : rating;
  const fullStars = Math.floor(numRating);
  const hasHalf = numRating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(iconSize, "fill-amber-400 text-amber-400")}
          />
        ))}
        {hasHalf && (
          <StarHalf
            className={cn(iconSize, "fill-amber-400 text-amber-400")}
          />
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(iconSize, "text-muted-foreground/30")}
          />
        ))}
      </div>
      {reviewCount !== undefined && (
        <span className="text-xs text-muted-foreground">({reviewCount})</span>
      )}
    </div>
  );
}
