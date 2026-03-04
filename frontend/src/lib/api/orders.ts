/** Typed API wrappers for order endpoints. */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type {
  OrderRead,
  OrderSummaryRead,
  PaginatedResponse,
  FulfillmentType,
} from "@/types/database";

export interface OrderCreateRequest {
  delivery_address_id?: string | null;
  delivery_zone_id?: string | null;
  fulfillment_type?: FulfillmentType;
  coupon_code?: string | null;
  customer_note?: string | null;
}

export interface OrderListParams {
  skip?: number;
  limit?: number;
  status?: string;
}

export interface OrderCancelRequest {
  cancel_reason?: string | null;
}

/** Place an order from the current cart for a shop. */
export async function createOrder(
  slug: string,
  data: OrderCreateRequest,
): Promise<OrderRead> {
  const response = await api.post<OrderRead>(
    API_ROUTES.SHOP.ORDERS(slug),
    data,
  );
  return response.data;
}

/** List the current user's orders across all shops. */
export async function listOrders(
  params?: OrderListParams,
): Promise<PaginatedResponse<OrderSummaryRead>> {
  const response = await api.get<PaginatedResponse<OrderSummaryRead>>(
    API_ROUTES.ORDERS,
    { params },
  );
  return response.data;
}

/** Get a single order by ID. */
export async function getOrder(orderId: string): Promise<OrderRead> {
  const response = await api.get<OrderRead>(API_ROUTES.ORDER(orderId));
  return response.data;
}

/** Cancel an order. */
export async function cancelOrder(
  orderId: string,
  data?: OrderCancelRequest,
): Promise<OrderRead> {
  const response = await api.post<OrderRead>(
    API_ROUTES.ORDER_CANCEL(orderId),
    data ?? {},
  );
  return response.data;
}
