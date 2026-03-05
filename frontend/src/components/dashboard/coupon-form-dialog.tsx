/** Dialog for creating and editing coupons. */

"use client";

import { useEffect, useState } from "react";
import { useCreateCoupon, useUpdateCoupon } from "@/hooks/use-coupons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { CouponRead, CouponScope, DiscountType } from "@/types/database";

type CouponFormDialogProps =
  | {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      slug: string;
      coupon?: undefined;
    }
  | {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      slug: string;
      coupon: CouponRead;
    };

export function CouponFormDialog({
  open,
  onOpenChange,
  slug,
  coupon,
}: CouponFormDialogProps) {
  /** Renders a dialog for creating or editing a coupon. */
  const isEdit = !!coupon;
  const createCoupon = useCreateCoupon(slug);
  const updateCoupon = useUpdateCoupon(slug);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [maxUsage, setMaxUsage] = useState("");
  const [maxUsagePerUser, setMaxUsagePerUser] = useState("1");
  const [appliesTo, setAppliesTo] = useState<CouponScope>("all");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (coupon) {
      setCode(coupon.code);
      setDiscountType(coupon.discount_type);
      setDiscountValue(coupon.discount_value);
      setMinOrderAmount(coupon.min_order_amount ?? "");
      setMaxDiscountAmount(coupon.max_discount_amount ?? "");
      setMaxUsage(coupon.max_usage?.toString() ?? "");
      setMaxUsagePerUser(coupon.max_usage_per_user.toString());
      setAppliesTo(coupon.applies_to);
      setValidFrom(coupon.valid_from.slice(0, 16));
      setValidUntil(coupon.valid_until.slice(0, 16));
      setIsActive(coupon.is_active);
    } else {
      setCode("");
      setDiscountType("percentage");
      setDiscountValue("");
      setMinOrderAmount("");
      setMaxDiscountAmount("");
      setMaxUsage("");
      setMaxUsagePerUser("1");
      setAppliesTo("all");
      setValidFrom("");
      setValidUntil("");
      setIsActive(true);
    }
  }, [coupon, open]);

  const isPending = createCoupon.isPending || updateCoupon.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountValue || !validFrom || !validUntil) return;

    if (isEdit) {
      updateCoupon.mutate(
        {
          couponId: coupon.coupon_id,
          data: {
            discount_value: discountValue,
            min_order_amount: minOrderAmount || null,
            max_discount_amount: maxDiscountAmount || null,
            max_usage: maxUsage ? parseInt(maxUsage) : null,
            max_usage_per_user: parseInt(maxUsagePerUser) || 1,
            is_active: isActive,
            valid_from: new Date(validFrom).toISOString(),
            valid_until: new Date(validUntil).toISOString(),
          },
        },
        {
          onSuccess: () => {
            toast.success("Coupon updated");
            onOpenChange(false);
          },
          onError: () => toast.error("Failed to update coupon"),
        },
      );
    } else {
      if (!code.trim()) return;
      createCoupon.mutate(
        {
          code: code.trim(),
          discount_type: discountType,
          discount_value: discountValue,
          min_order_amount: minOrderAmount || null,
          max_discount_amount: maxDiscountAmount || null,
          max_usage: maxUsage ? parseInt(maxUsage) : null,
          max_usage_per_user: parseInt(maxUsagePerUser) || 1,
          applies_to: appliesTo,
          valid_from: new Date(validFrom).toISOString(),
          valid_until: new Date(validUntil).toISOString(),
        },
        {
          onSuccess: () => {
            toast.success("Coupon created");
            onOpenChange(false);
          },
          onError: () => toast.error("Failed to create coupon"),
        },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {!isEdit && (
              <div className="space-y-1.5">
                <Label>Discount Type</Label>
                <Select
                  value={discountType}
                  onValueChange={(v) => setDiscountType(v as DiscountType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (BDT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="discount_value">
                Discount Value{" "}
                {discountType === "percentage" ? "(%)" : "(BDT)"}
              </Label>
              <Input
                id="discount_value"
                type="number"
                step="0.01"
                min="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="min_order">Min Order Amount</Label>
              <Input
                id="min_order"
                type="number"
                step="0.01"
                min="0"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_discount">Max Discount Amount</Label>
              <Input
                id="max_discount"
                type="number"
                step="0.01"
                min="0"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="max_usage">Max Total Usage</Label>
              <Input
                id="max_usage"
                type="number"
                min="1"
                value={maxUsage}
                onChange={(e) => setMaxUsage(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_per_user">Max Per User</Label>
              <Input
                id="max_per_user"
                type="number"
                min="1"
                value={maxUsagePerUser}
                onChange={(e) => setMaxUsagePerUser(e.target.value)}
              />
            </div>
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Applies To</Label>
              <Select
                value={appliesTo}
                onValueChange={(v) => setAppliesTo(v as CouponScope)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="category">Specific Category</SelectItem>
                  <SelectItem value="product">Specific Product</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="valid_from">Valid From</Label>
              <Input
                id="valid_from"
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input
                id="valid_until"
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
              />
            </div>
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Update Coupon"
                  : "Create Coupon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
