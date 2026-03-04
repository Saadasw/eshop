/** Typed API wrappers for shop-scoped order management endpoints. */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type {
  OrderRead,
  OrderSummaryRead,
  OrderStatusUpdate,
  PaginatedResponse,
} from "@/types/database";

export interface ShopOrderListParams {
  skip?: number;
  limit?: number;
  status?: string;
}

export interface ShopOrderCancelRequest {
  cancel_reason?: string | null;
}

/** List orders for a specific shop (owner/staff view). */
export async function listShopOrders(
  slug: string,
  params?: ShopOrderListParams,
): Promise<PaginatedResponse<OrderSummaryRead>> {
  const response = await api.get<PaginatedResponse<OrderSummaryRead>>(
    API_ROUTES.SHOP.ORDERS(slug),
    { params },
  );
  return response.data;
}

/** Get a single shop order by ID (owner/staff view). */
export async function getShopOrder(
  slug: string,
  orderId: string,
): Promise<OrderRead> {
  const response = await api.get<OrderRead>(
    API_ROUTES.SHOP.SHOP_ORDER(slug, orderId),
  );
  return response.data;
}

/** Update an order's status (owner/staff). */
export async function updateOrderStatus(
  slug: string,
  orderId: string,
  data: OrderStatusUpdate,
): Promise<OrderRead> {
  const response = await api.patch<OrderRead>(
    API_ROUTES.SHOP.SHOP_ORDER_STATUS(slug, orderId),
    data,
  );
  return response.data;
}

/** Cancel a shop order (owner/staff). */
export async function cancelShopOrder(
  slug: string,
  orderId: string,
  data?: ShopOrderCancelRequest,
): Promise<OrderRead> {
  const response = await api.post<OrderRead>(
    API_ROUTES.SHOP.SHOP_ORDER_CANCEL(slug, orderId),
    data ?? {},
  );
  return response.data;
}
