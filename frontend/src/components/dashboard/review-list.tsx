/** Dashboard review list — view, reply, and delete reviews across all products. */

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReplyToReview, useDeleteReview } from "@/hooks/use-reviews";
import { ConfirmDialog } from "./confirm-dialog";
import { RatingStars } from "@/components/storefront/rating-stars";
import { EmptyState } from "@/components/storefront/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageSquare,
  Trash2,
  Star,
  User,
  Reply,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateBST } from "@/lib/utils/format";
import { api } from "@/lib/api/client";
import type { ReviewRead, PaginatedResponse, ProductRead } from "@/types/database";

interface ReviewListProps {
  slug: string;
}

export function ReviewList({ slug }: ReviewListProps) {
  /** Renders all reviews across shop products with reply/delete actions. */
  const replyMutation = useReplyToReview(slug);
  const deleteMutation = useDeleteReview(slug);

  const [replyTarget, setReplyTarget] = useState<ReviewRead | null>(null);
  const [replyText, setReplyText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Fetch products first, then reviews for each
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["dashboard-products", slug],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<ProductRead>>(
        `/api/v1/shops/${slug}/products`,
        { params: { limit: 100, is_active: true } },
      );
      return res.data.items;
    },
    enabled: !!slug,
  });

  // Fetch reviews for all products
  const { data: allReviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews", slug, "all"],
    queryFn: async () => {
      if (!products || products.length === 0) return [];
      const results = await Promise.all(
        products
          .filter((p) => p.review_count > 0)
          .map(async (p) => {
            const res = await api.get<PaginatedResponse<ReviewRead>>(
              `/api/v1/shops/${slug}/products/${p.product_id}/reviews`,
              { params: { limit: 100 } },
            );
            return res.data.items.map((r) => ({
              ...r,
              _product_name: p.name,
            }));
          }),
      );
      return results.flat();
    },
    enabled: !!products && products.length > 0,
  });

  const handleReply = () => {
    if (!replyTarget || !replyText.trim()) return;
    replyMutation.mutate(
      { reviewId: replyTarget.review_id, data: { shop_reply: replyText.trim() } },
      {
        onSuccess: () => {
          toast.success("Reply posted");
          setReplyTarget(null);
          setReplyText("");
        },
        onError: () => toast.error("Failed to post reply"),
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget, {
      onSuccess: () => {
        toast.success("Review deleted");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Failed to delete review"),
    });
  };

  const isLoading = productsLoading || reviewsLoading;
  const reviews = allReviews as
    | (ReviewRead & { _product_name: string })[]
    | undefined;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reviews</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <EmptyState
          icon={<Star className="h-12 w-12" />}
          title="No reviews yet"
          description="Reviews will appear here when customers review your products."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.review_id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {review.is_anonymous
                            ? "Anonymous"
                            : review.customer_name ?? "Customer"}
                        </span>
                        <RatingStars rating={review.rating} />
                        <span className="text-xs text-muted-foreground">
                          {formatDateBST(review.created_at, {
                            dateStyle: "medium",
                            timeStyle: undefined,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Product: {review._product_name}
                      </p>
                      {review.comment && (
                        <p className="text-sm">{review.comment}</p>
                      )}
                      {review.shop_reply && (
                        <div className="mt-2 rounded-md bg-muted/50 p-2">
                          <p className="text-xs font-medium text-primary">
                            Your Reply
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {review.shop_reply}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!review.shop_reply && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setReplyTarget(review);
                          setReplyText("");
                        }}
                      >
                        <Reply className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(review.review_id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog
        open={!!replyTarget}
        onOpenChange={(open) => !open && setReplyTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Review</DialogTitle>
          </DialogHeader>
          {replyTarget && (
            <div className="space-y-3">
              <div className="rounded-md bg-muted p-3">
                <div className="flex items-center gap-2">
                  <RatingStars rating={replyTarget.rating} />
                  <span className="text-sm">
                    {replyTarget.is_anonymous
                      ? "Anonymous"
                      : replyTarget.customer_name ?? "Customer"}
                  </span>
                </div>
                {replyTarget.comment && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {replyTarget.comment}
                  </p>
                )}
              </div>
              <Textarea
                placeholder="Write your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReplyTarget(null)}
              disabled={replyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReply}
              disabled={!replyText.trim() || replyMutation.isPending}
            >
              {replyMutation.isPending ? "Posting..." : "Post Reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Review"
        description="Are you sure? This will remove the review from the product page."
        confirmLabel="Delete"
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
