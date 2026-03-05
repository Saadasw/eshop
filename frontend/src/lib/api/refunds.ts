/** Typed API wrappers for refund operations. */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type {
  RefundRead,
  RefundRequest,
  RefundStatusUpdate,
  PaginatedResponse,
} from "@/types/database";

/** Request a refund for an order (customer). */
export async function requestRefund(
  orderId: string,
  data: RefundRequest,
): Promise<RefundRead> {
  const response = await api.post<RefundRead>(
    API_ROUTES.ORDER_REFUND(orderId),
    data,
  );
  return response.data;
}

/** List refunds for a shop (owner/staff). */
export async function listShopRefunds(
  slug: string,
  params?: { skip?: number; limit?: number; status?: string },
): Promise<PaginatedResponse<RefundRead>> {
  const response = await api.get<PaginatedResponse<RefundRead>>(
    API_ROUTES.SHOP_REFUNDS(slug),
    { params },
  );
  return response.data;
}

/** Get a single refund (owner/staff). */
export async function getShopRefund(
  slug: string,
  refundId: string,
): Promise<RefundRead> {
  const response = await api.get<RefundRead>(
    API_ROUTES.SHOP_REFUND(slug, refundId),
  );
  return response.data;
}

/** Update refund status (owner/staff). */
export async function updateRefundStatus(
  slug: string,
  refundId: string,
  data: RefundStatusUpdate,
): Promise<RefundRead> {
  const response = await api.patch<RefundRead>(
    API_ROUTES.SHOP_REFUND(slug, refundId),
    data,
  );
  return response.data;
}
