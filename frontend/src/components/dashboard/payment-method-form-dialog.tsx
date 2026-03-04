/** Dialog for creating or editing a payment method configuration. */

"use client";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  PaymentMethod,
  ShopPaymentMethodRead,
  ShopPaymentMethodCreate,
  ShopPaymentMethodUpdate,
} from "@/types/database";

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
  { value: "cod", label: "Cash on Delivery" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

/** Discriminated union for create vs update. */
type PaymentMethodFormData =
  | { isNew: true; data: ShopPaymentMethodCreate }
  | { isNew: false; data: ShopPaymentMethodUpdate };

interface PaymentMethodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod?: ShopPaymentMethodRead;
  isPending: boolean;
  onSubmit: (result: PaymentMethodFormData) => void;
}

export function PaymentMethodFormDialog({
  open,
  onOpenChange,
  paymentMethod,
  isPending,
  onSubmit,
}: PaymentMethodFormDialogProps) {
  /** Renders form fields for payment method config. */
  const isEdit = !!paymentMethod;

  const [form, setForm] = useState({
    method: "bkash" as PaymentMethod,
    is_enabled: true,
    merchant_id: "",
    display_account: "",
    sort_order: "0",
  });

  useEffect(() => {
    if (paymentMethod) {
      setForm({
        method: paymentMethod.method,
        is_enabled: paymentMethod.is_enabled,
        merchant_id: paymentMethod.merchant_id ?? "",
        display_account: paymentMethod.display_account ?? "",
        sort_order: paymentMethod.sort_order.toString(),
      });
    } else {
      setForm({
        method: "bkash",
        is_enabled: true,
        merchant_id: "",
        display_account: "",
        sort_order: "0",
      });
    }
  }, [paymentMethod, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      onSubmit({
        isNew: false,
        data: {
          is_enabled: form.is_enabled,
          merchant_id: form.merchant_id || undefined,
          display_account: form.display_account || undefined,
          sort_order: parseInt(form.sort_order) || 0,
        },
      });
    } else {
      onSubmit({
        isNew: true,
        data: {
          method: form.method,
          is_enabled: form.is_enabled,
          merchant_id: form.merchant_id || undefined,
          display_account: form.display_account || undefined,
          sort_order: parseInt(form.sort_order) || 0,
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Payment Method" : "Add Payment Method"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label>Method *</Label>
              <Select
                value={form.method}
                onValueChange={(v) =>
                  setForm({ ...form, method: v as PaymentMethod })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Merchant ID</Label>
            <Input
              value={form.merchant_id}
              onChange={(e) => setForm({ ...form, merchant_id: e.target.value })}
              placeholder="Merchant ID from provider"
            />
          </div>
          <div className="space-y-2">
            <Label>Display Account</Label>
            <Input
              value={form.display_account}
              onChange={(e) => setForm({ ...form, display_account: e.target.value })}
              placeholder="Account shown to customers"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Enabled</Label>
            <Switch
              checked={form.is_enabled}
              onCheckedChange={(v) => setForm({ ...form, is_enabled: v })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
