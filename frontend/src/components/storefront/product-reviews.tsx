/** Product review list with pagination, displayed on product detail page. */

"use client";

import { useState } from "react";
import { useProductReviews } from "@/hooks/use-reviews";
import { RatingStars } from "./rating-stars";
import { Pagination } from "./pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, User } from "lucide-react";
import { formatDateBST } from "@/lib/utils/format";

interface ProductReviewsProps {
  slug: string;
  productId: string;
  reviewCount: number;
  avgRating: string;
}

export function ProductReviews({
  slug,
  productId,
  reviewCount,
  avgRating,
}: ProductReviewsProps) {
  /** Renders a review list with pagination and rating summary. */
  const pageSize = 10;
  const [skip, setSkip] = useState(0);
  const { data, isLoading } = useProductReviews(slug, productId, {
    skip,
    limit: pageSize,
  });

  if (reviewCount === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Customer Reviews</h2>
        <RatingStars rating={avgRating} reviewCount={reviewCount} size="md" />
      </div>

      <Separator />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {data.items.map((review) => (
            <div key={review.review_id} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {review.is_anonymous
                      ? "Anonymous"
                      : review.customer_name ?? "Customer"}
                  </p>
                  <div className="flex items-center gap-2">
                    <RatingStars rating={review.rating} />
                    <span className="text-xs text-muted-foreground">
                      {formatDateBST(review.created_at, {
                        dateStyle: "medium",
                        timeStyle: undefined,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {review.comment && (
                <p className="text-sm text-muted-foreground pl-10">
                  {review.comment}
                </p>
              )}

              {review.shop_reply && (
                <div className="ml-10 rounded-md bg-muted/50 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <MessageSquare className="h-3 w-3" />
                    Shop Reply
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {review.shop_reply}
                  </p>
                </div>
              )}

              <Separator />
            </div>
          ))}

          {data && data.total > pageSize && (
            <Pagination
              total={data.total}
              skip={skip}
              limit={pageSize}
              onChange={setSkip}
            />
          )}
        </div>
      )}
    </div>
  );
}
