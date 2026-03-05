/** TanStack Query hooks for review operations. */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listProductReviews,
  createReview,
  replyToReview,
  deleteReview,
} from "@/lib/api/reviews";
import type { ReviewCreate, ReviewReply } from "@/types/database";

/** Fetch reviews for a product (public). */
export function useProductReviews(
  slug: string,
  productId: string,
  params?: { skip?: number; limit?: number },
) {
  return useQuery({
    queryKey: ["reviews", slug, productId, params],
    queryFn: () => listProductReviews(slug, productId, params),
    enabled: !!slug && !!productId,
  });
}

/** Mutation to create a review. */
export function useCreateReview(slug: string, productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReviewCreate) => createReview(slug, productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", slug, productId],
      });
      queryClient.invalidateQueries({
        queryKey: ["product", slug, productId],
      });
    },
  });
}

/** Mutation to reply to a review (owner/staff). */
export function useReplyToReview(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reviewId,
      data,
    }: {
      reviewId: string;
      data: ReviewReply;
    }) => replyToReview(slug, reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", slug] });
    },
  });
}

/** Mutation to delete a review (owner/staff). */
export function useDeleteReview(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => deleteReview(slug, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", slug] });
    },
  });
}
