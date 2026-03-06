/** Admin payout management — create payouts for shops and update status. */

"use client";

import { useState } from "react";
import {
  useAdminShops,
  useCreatePayout,
  useUpdatePayoutStatus,
} from "@/hooks/use-admin";
import { usePayouts } from "@/hooks/use-payouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateBST, formatBDT } from "@/lib/utils/format";
import { Plus } from "lucide-react";
import type {
  PayoutMethod,
  PayoutRead,
  PayoutStatus,
  ShopAdminRead,
} from "@/types/database";

const PAYOUT_STATUS_COLORS: Record<PayoutStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

const VALID_PAYOUT_TRANSITIONS: Record<PayoutStatus, PayoutStatus[]> = {
  pending: ["processing"],
  processing: ["completed", "failed"],
  completed: [],
  failed: ["processing"],
};

export function PayoutManagement() {
  /** Renders payout creation form and per-shop payout list. */
  const [selectedShop, setSelectedShop] = useState<ShopAdminRead | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("bkash");
  const [commissionRate, setCommissionRate] = useState("0.05");
  const [notes, setNotes] = useState("");

  const [statusPayout, setStatusPayout] = useState<PayoutRead | null>(null);
  const [targetStatus, setTargetStatus] = useState<PayoutStatus | null>(null);
  const [txRef, setTxRef] = useState("");

  const { data: shopsData, isLoading: shopsLoading } = useAdminShops({
    limit: 100,
    status: "active",
  });
  const { data: payoutsData, isLoading: payoutsLoading } = usePayouts(
    selectedShop?.slug ?? "",
  );

  const createPayout = useCreatePayout();
  const updateStatus = useUpdatePayoutStatus();

  function handleCreate() {
    if (!selectedShop || !periodStart || !periodEnd) return;
    createPayout.mutate(
      {
        shop_id: selectedShop.shop_id,
        period_start: new Date(periodStart).toISOString(),
        period_end: new Date(periodEnd).toISOString(),
        payout_method: payoutMethod,
        commission_rate: commissionRate,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setPeriodStart("");
          setPeriodEnd("");
          setNotes("");
        },
      },
    );
  }

  function handleStatusUpdate() {
    if (!statusPayout || !targetStatus) return;
    updateStatus.mutate(
      {
        payoutId: statusPayout.payout_id,
        data: {
          status: targetStatus,
          transaction_reference: txRef || undefined,
        },
      },
      { onSuccess: () => setStatusPayout(null) },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payout Management</h1>
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={!selectedShop}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Payout
        </Button>
      </div>

      {/* Shop selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Shop</CardTitle>
        </CardHeader>
        <CardContent>
          {shopsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={selectedShop?.shop_id ?? ""}
              onValueChange={(id) => {
                const shop = shopsData?.items.find((s) => s.shop_id === id);
                setSelectedShop(shop ?? null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a shop to manage payouts" />
              </SelectTrigger>
              <SelectContent>
                {shopsData?.items.map((shop) => (
                  <SelectItem key={shop.shop_id} value={shop.shop_id}>
                    {shop.shop_name} ({shop.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Payouts table */}
      {selectedShop && (
        <Card>
          <CardHeader>
            <CardTitle>Payouts for {selectedShop.shop_name}</CardTitle>
          </CardHeader>
          <CardContent>
            {payoutsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !payoutsData?.items.length ? (
              <p className="py-8 text-center text-muted-foreground">
                No payouts yet for this shop.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Refunds</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutsData.items.map((payout) => {
                    const transitions =
                      VALID_PAYOUT_TRANSITIONS[payout.status] || [];
                    return (
                      <TableRow key={payout.payout_id}>
                        <TableCell className="text-sm">
                          {formatDateBST(payout.period_start)} -{" "}
                          {formatDateBST(payout.period_end)}
                        </TableCell>
                        <TableCell>{payout.order_count}</TableCell>
                        <TableCell>{formatBDT(payout.gross_amount)}</TableCell>
                        <TableCell>{formatBDT(payout.commission_amount)}</TableCell>
                        <TableCell>{formatBDT(payout.refund_deductions)}</TableCell>
                        <TableCell className="font-medium">
                          {formatBDT(payout.net_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={PAYOUT_STATUS_COLORS[payout.status]}
                          >
                            {payout.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {transitions.map((s) => (
                              <Button
                                key={s}
                                size="sm"
                                variant={
                                  s === "completed"
                                    ? "default"
                                    : s === "failed"
                                      ? "destructive"
                                      : "outline"
                                }
                                onClick={() => {
                                  setStatusPayout(payout);
                                  setTargetStatus(s);
                                  setTxRef("");
                                }}
                              >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create payout dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payout for {selectedShop?.shop_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Period Start</Label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Period End</Label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payout Method</Label>
                <Select
                  value={payoutMethod}
                  onValueChange={(v) => setPayoutMethod(v as PayoutMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Commission Rate</Label>
                <Input
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="0.05"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createPayout.isPending || !periodStart || !periodEnd}
            >
              {createPayout.isPending ? "Creating..." : "Create Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status update dialog */}
      <Dialog
        open={!!statusPayout}
        onOpenChange={(open) => !open && setStatusPayout(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payout Status</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Change payout from{" "}
            <Badge
              variant="secondary"
              className={PAYOUT_STATUS_COLORS[statusPayout?.status ?? "pending"]}
            >
              {statusPayout?.status}
            </Badge>{" "}
            to{" "}
            <Badge
              variant="secondary"
              className={PAYOUT_STATUS_COLORS[targetStatus ?? "pending"]}
            >
              {targetStatus}
            </Badge>
          </p>
          {targetStatus === "completed" && (
            <div className="space-y-2">
              <Label>Transaction Reference</Label>
              <Input
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                placeholder="Transaction ID or reference"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusPayout(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updateStatus.isPending}
              variant={targetStatus === "failed" ? "destructive" : "default"}
            >
              {updateStatus.isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
