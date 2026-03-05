/** Dashboard payout list showing payout history for a shop. */

"use client";

import { useState } from "react";
import { usePayouts } from "@/hooks/use-payouts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/storefront/pagination";
import { formatBDT, formatDateBST } from "@/lib/utils/format";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

interface PayoutListProps {
  slug: string;
}

export function PayoutList({ slug }: PayoutListProps) {
  /** Renders a table of payouts with period, amounts, and status. */
  const [skip, setSkip] = useState(0);
  const { data, isLoading } = usePayouts(slug, {
    skip,
    limit: DEFAULT_PAGE_SIZE,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Payouts</h2>

      {!data || data.items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No payouts yet. Payouts are created by the platform admin after each
            period.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Refunds</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((payout) => (
                  <TableRow key={payout.payout_id}>
                    <TableCell className="text-sm">
                      {formatDateBST(payout.period_start)} -{" "}
                      {formatDateBST(payout.period_end)}
                    </TableCell>
                    <TableCell>{payout.order_count}</TableCell>
                    <TableCell>{formatBDT(payout.gross_amount)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      -{formatBDT(payout.commission_amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      -{formatBDT(payout.refund_deductions)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatBDT(payout.net_amount)}
                    </TableCell>
                    <TableCell className="capitalize text-sm">
                      {payout.payout_method.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={STATUS_COLORS[payout.status] ?? ""}
                      >
                        {payout.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {data.total > DEFAULT_PAGE_SIZE && (
            <Pagination
              total={data.total}
              skip={data.skip}
              limit={data.limit}
              onChange={setSkip}
            />
          )}
        </>
      )}
    </div>
  );
}
