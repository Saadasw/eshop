/** Dashboard refund management list with status filter and update. */

"use client";

import { useState } from "react";
import { useShopRefunds, useUpdateRefundStatus } from "@/hooks/use-refunds";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import type { RefundRead, RefundStatus } from "@/types/database";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  rejected: "bg-red-100 text-red-800",
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  requested: ["approved", "rejected"],
  approved: ["processing"],
  processing: ["completed", "failed"],
};

interface RefundListProps {
  slug: string;
}

export function RefundList({ slug }: RefundListProps) {
  /** Renders refund list with status filter, detail dialog, and status update. */
  const [skip, setSkip] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRefund, setSelectedRefund] = useState<RefundRead | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [restock, setRestock] = useState(false);

  const { data, isLoading } = useShopRefunds(slug, {
    skip,
    limit: DEFAULT_PAGE_SIZE,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const updateStatus = useUpdateRefundStatus(slug);

  const handleStatusUpdate = (refundId: string, newStatus: RefundStatus) => {
    updateStatus.mutate(
      {
        refundId,
        data: {
          status: newStatus,
          admin_note: adminNote || null,
          restock: newStatus === "completed" ? restock : false,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Refund ${newStatus}`);
          setSelectedRefund(null);
          setAdminNote("");
          setRestock(false);
        },
        onError: () => toast.error("Failed to update refund"),
      },
    );
  };

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Refunds</h2>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setSkip(0); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="requested">Requested</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!data || data.items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No refunds found
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((refund) => {
                  const transitions = VALID_TRANSITIONS[refund.status] ?? [];
                  return (
                    <TableRow key={refund.refund_id}>
                      <TableCell className="text-sm">
                        {formatDateBST(refund.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatBDT(refund.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={STATUS_COLORS[refund.status] ?? ""}
                        >
                          {refund.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {refund.reason}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRefund(refund)}
                        >
                          {transitions.length > 0 ? "Manage" : "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

      {/* Refund Detail/Action Dialog */}
      <Dialog
        open={!!selectedRefund}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRefund(null);
            setAdminNote("");
            setRestock(false);
          }
        }}
      >
        {selectedRefund && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Refund Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  {formatBDT(selectedRefund.amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant="secondary"
                  className={STATUS_COLORS[selectedRefund.status] ?? ""}
                >
                  {selectedRefund.status}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span>{formatDateBST(selectedRefund.created_at)}</span>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Reason</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedRefund.reason}
                </p>
              </div>
              {selectedRefund.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Items</p>
                  <div className="mt-1 space-y-1">
                    {selectedRefund.items.map((item) => (
                      <div
                        key={item.refund_item_id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          Qty: {item.quantity}
                          {item.restocked && " (restocked)"}
                        </span>
                        <span>{formatBDT(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedRefund.admin_note && (
                <div>
                  <p className="text-sm font-medium">Admin Note</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedRefund.admin_note}
                  </p>
                </div>
              )}

              {(VALID_TRANSITIONS[selectedRefund.status] ?? []).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label htmlFor="admin-note">Note (optional)</Label>
                    <Textarea
                      id="admin-note"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  {(VALID_TRANSITIONS[selectedRefund.status] ?? []).includes(
                    "completed",
                  ) && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="restock"
                        checked={restock}
                        onChange={(e) => setRestock(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="restock" className="text-sm">
                        Restock items
                      </Label>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {(VALID_TRANSITIONS[selectedRefund.status] ?? []).map(
                      (status) => (
                        <Button
                          key={status}
                          variant={
                            status === "rejected" || status === "failed"
                              ? "destructive"
                              : "default"
                          }
                          size="sm"
                          onClick={() =>
                            handleStatusUpdate(
                              selectedRefund.refund_id,
                              status as RefundStatus,
                            )
                          }
                          disabled={updateStatus.isPending}
                          className="flex-1 capitalize"
                        >
                          {status}
                        </Button>
                      ),
                    )}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
