/** Admin shop management — list shops with status filter and approval actions. */

"use client";

import { useState } from "react";
import { useAdminShops, useUpdateShopStatus } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/storefront/pagination";
import { formatDateBST } from "@/lib/utils/format";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";
import type { ShopAdminRead, ShopStatus } from "@/types/database";

const STATUS_OPTIONS: { value: ShopStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "rejected", label: "Rejected" },
  { value: "paused", label: "Paused" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
  { value: "closed", label: "Closed" },
];

/** Valid status transitions for admin actions. */
const VALID_SHOP_TRANSITIONS: Record<ShopStatus, ShopStatus[]> = {
  pending: ["active", "rejected"],
  active: ["paused", "suspended", "closed"],
  rejected: ["pending"],
  paused: ["active", "closed"],
  suspended: ["active", "banned"],
  banned: [],
  closed: [],
};

const STATUS_COLORS: Record<ShopStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  paused: "bg-gray-100 text-gray-800",
  suspended: "bg-orange-100 text-orange-800",
  banned: "bg-red-200 text-red-900",
  closed: "bg-gray-200 text-gray-900",
};

export function ShopManagement() {
  /** Renders shop list with filters and status update actions. */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShopStatus | "all">("all");
  const [page, setPage] = useState(0);
  const [selectedShop, setSelectedShop] = useState<ShopAdminRead | null>(null);
  const [targetStatus, setTargetStatus] = useState<ShopStatus | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data, isLoading } = useAdminShops({
    skip: page * DEFAULT_PAGE_SIZE,
    limit: DEFAULT_PAGE_SIZE,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: search || undefined,
  });
  const updateStatus = useUpdateShopStatus();

  function handleStatusAction(shop: ShopAdminRead, status: ShopStatus) {
    setSelectedShop(shop);
    setTargetStatus(status);
    setRejectionReason("");
  }

  function confirmStatusUpdate() {
    if (!selectedShop || !targetStatus) return;
    updateStatus.mutate(
      {
        shopId: selectedShop.shop_id,
        data: {
          status: targetStatus,
          rejection_reason: targetStatus === "rejected" ? rejectionReason || undefined : undefined,
        },
      },
      { onSuccess: () => setSelectedShop(null) },
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Shop Management</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Shops</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search shops..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-48"
              />
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as ShopStatus | "all");
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data?.items.length ? (
            <p className="py-8 text-center text-muted-foreground">
              No shops found.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shop Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((shop) => {
                    const transitions = VALID_SHOP_TRANSITIONS[shop.status] || [];
                    return (
                      <TableRow key={shop.shop_id}>
                        <TableCell className="font-medium">
                          {shop.shop_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {shop.slug}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={STATUS_COLORS[shop.status]}
                          >
                            {shop.status}
                          </Badge>
                          {shop.rejection_reason && (
                            <p className="mt-1 text-xs text-red-600">
                              {shop.rejection_reason}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {shop.contact_email && (
                              <p className="truncate">{shop.contact_email}</p>
                            )}
                            {shop.contact_phone && (
                              <p className="text-muted-foreground">
                                {shop.contact_phone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateBST(shop.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {transitions.map((s) => (
                              <Button
                                key={s}
                                size="sm"
                                variant={
                                  s === "active"
                                    ? "default"
                                    : s === "banned" || s === "rejected"
                                      ? "destructive"
                                      : "outline"
                                }
                                onClick={() => handleStatusAction(shop, s)}
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

              {data.total > DEFAULT_PAGE_SIZE && (
                <div className="mt-4">
                  <Pagination
                    total={data.total}
                    skip={data.skip}
                    limit={data.limit}
                    onChange={(skip) => setPage(Math.floor(skip / DEFAULT_PAGE_SIZE))}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Status update confirmation dialog */}
      <Dialog
        open={!!selectedShop}
        onOpenChange={(open) => !open && setSelectedShop(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {targetStatus === "active"
                ? "Approve Shop"
                : targetStatus === "rejected"
                  ? "Reject Shop"
                  : `${targetStatus?.charAt(0).toUpperCase()}${targetStatus?.slice(1)} Shop`}
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Change <strong>{selectedShop?.shop_name}</strong> from{" "}
            <Badge variant="secondary" className={STATUS_COLORS[selectedShop?.status ?? "pending"]}>
              {selectedShop?.status}
            </Badge>{" "}
            to{" "}
            <Badge variant="secondary" className={STATUS_COLORS[targetStatus ?? "pending"]}>
              {targetStatus}
            </Badge>
            ?
          </p>

          {targetStatus === "rejected" && (
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Why is this shop being rejected?"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedShop(null)}>
              Cancel
            </Button>
            <Button
              variant={
                targetStatus === "banned" || targetStatus === "rejected"
                  ? "destructive"
                  : "default"
              }
              onClick={confirmStatusUpdate}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
