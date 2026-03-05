/** TanStack Query hooks for payout operations. */

"use client";

import { useQuery } from "@tanstack/react-query";
import { listPayouts } from "@/lib/api/payouts";

/** List payouts for a shop (dashboard). */
export function usePayouts(
  slug: string,
  params?: { skip?: number; limit?: number },
) {
  return useQuery({
    queryKey: ["payouts", slug, params],
    queryFn: () => listPayouts(slug, params),
    enabled: !!slug,
  });
}
