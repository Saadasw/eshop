/** Typed API wrappers for review operations. */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type {
  ReviewRead,
  ReviewCreate,
  ReviewReply,
  PaginatedResponse,
} from "@/types/database";

/** List reviews for a product (public). */
export async function listProductReviews(
  slug: string,
  productId: string,
  params?: { skip?: number; limit?: number },
): Promise<PaginatedResponse<ReviewRead>> {
  const response = await api.get<PaginatedResponse<ReviewRead>>(
    API_ROUTES.SHOP.REVIEWS(slug, productId),
    { params },
  );
  return response.data;
}

/** Create a review for a product. */
export async function createReview(
  slug: string,
  productId: string,
  data: ReviewCreate,
): Promise<ReviewRead> {
  const response = await api.post<ReviewRead>(
    API_ROUTES.SHOP.REVIEWS(slug, productId),
    data,
  );
  return response.data;
}

/** Reply to a review (owner/staff). */
export async function replyToReview(
  slug: string,
  reviewId: string,
  data: ReviewReply,
): Promise<ReviewRead> {
  const response = await api.post<ReviewRead>(
    API_ROUTES.SHOP.REVIEW_REPLY(slug, reviewId),
    data,
  );
  return response.data;
}

/** Soft-delete a review (owner/staff). */
export async function deleteReview(
  slug: string,
  reviewId: string,
): Promise<void> {
  await api.delete(API_ROUTES.SHOP.REVIEW_DELETE(slug, reviewId));
}
