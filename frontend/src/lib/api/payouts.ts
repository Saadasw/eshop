/** Typed API wrappers for payout operations. */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type { PayoutRead, PaginatedResponse } from "@/types/database";

/** List payouts for a shop (owner/staff). */
export async function listPayouts(
  slug: string,
  params?: { skip?: number; limit?: number },
): Promise<PaginatedResponse<PayoutRead>> {
  const response = await api.get<PaginatedResponse<PayoutRead>>(
    API_ROUTES.SHOP_PAYOUTS(slug),
    { params },
  );
  return response.data;
}
