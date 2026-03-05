/** Dashboard coupon list with create/edit/delete actions. */

"use client";

import { useState } from "react";
import { useCoupons, useDeleteCoupon } from "@/hooks/use-coupons";
import { CouponFormDialog } from "./coupon-form-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { EmptyState } from "@/components/storefront/empty-state";
import { Pagination } from "@/components/storefront/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { formatBDT, formatDateBST } from "@/lib/utils/format";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";
import type { CouponRead } from "@/types/database";

interface CouponListProps {
  slug: string;
}

export function CouponList({ slug }: CouponListProps) {
  /** Renders coupons table with CRUD dialogs. */
  const [skip, setSkip] = useState(0);
  const { data, isLoading } = useCoupons(slug, {
    skip,
    limit: DEFAULT_PAGE_SIZE,
  });
  const deleteCoupon = useDeleteCoupon(slug);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponRead | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleEdit = (coupon: CouponRead) => {
    setEditingCoupon(coupon);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteCoupon.mutate(deleteTarget, {
      onSuccess: () => {
        toast.success("Coupon deleted");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Failed to delete coupon"),
    });
  };

  const isExpired = (coupon: CouponRead) =>
    new Date(coupon.valid_until) < new Date();


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Button
          onClick={() => {
            setEditingCoupon(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Coupon
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-12 w-12" />}
          title="No coupons"
          description="Create discount coupons for your customers."
          action={
            <Button
              onClick={() => {
                setEditingCoupon(undefined);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Coupon
            </Button>
          }
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((coupon) => (
                  <TableRow key={coupon.coupon_id}>
                    <TableCell className="font-mono font-medium">
                      {coupon.code}
                    </TableCell>
                    <TableCell>
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : formatBDT(coupon.discount_value)}
                      {coupon.max_discount_amount && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (max {formatBDT(coupon.max_discount_amount)})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {coupon.times_used}
                      {coupon.max_usage !== null && `/${coupon.max_usage}`}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDateBST(coupon.valid_from, {
                        dateStyle: "short",
                        timeStyle: undefined,
                      })}{" "}
                      —{" "}
                      {formatDateBST(coupon.valid_until, {
                        dateStyle: "short",
                        timeStyle: undefined,
                      })}
                    </TableCell>
                    <TableCell>
                      {isExpired(coupon) ? (
                        <Badge variant="secondary">Expired</Badge>
                      ) : coupon.is_active ? (
                        <Badge>Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(coupon)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(coupon.coupon_id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data && data.total > DEFAULT_PAGE_SIZE && (
            <Pagination
              total={data.total}
              skip={skip}
              limit={DEFAULT_PAGE_SIZE}
              onChange={setSkip}
            />
          )}
        </>
      )}

      {formOpen && (
        <CouponFormDialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingCoupon(undefined);
          }}
          slug={slug}
          coupon={editingCoupon}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Coupon"
        description="Are you sure? This coupon will no longer be available to customers."
        confirmLabel="Delete"
        isPending={deleteCoupon.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
