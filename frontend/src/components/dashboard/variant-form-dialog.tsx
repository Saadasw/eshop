/** Dialog for creating or editing a product variant. */

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
import type { VariantRead } from "@/types/database";

interface VariantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: VariantRead;
  isPending: boolean;
  onSubmit: (data: {
    sku: string;
    variant_name?: string;
    price: string;
    stock_quantity: number;
    low_stock_threshold: number;
    track_inventory: boolean;
    weight_grams?: number;
    is_active?: boolean;
  }) => void;
}

export function VariantFormDialog({
  open,
  onOpenChange,
  variant,
  isPending,
  onSubmit,
}: VariantFormDialogProps) {
  /** Renders form fields for variant creation or editing. */
  const isEdit = !!variant;

  const [form, setForm] = useState({
    sku: "",
    variant_name: "",
    price: "",
    stock_quantity: "0",
    low_stock_threshold: "5",
    track_inventory: true,
    weight_grams: "",
    is_active: true,
  });

  useEffect(() => {
    if (variant) {
      setForm({
        sku: variant.sku,
        variant_name: variant.variant_name ?? "",
        price: variant.price,
        stock_quantity: variant.stock_quantity.toString(),
        low_stock_threshold: variant.low_stock_threshold.toString(),
        track_inventory: variant.track_inventory,
        weight_grams: variant.weight_grams?.toString() ?? "",
        is_active: variant.is_active,
      });
    } else {
      setForm({
        sku: "",
        variant_name: "",
        price: "",
        stock_quantity: "0",
        low_stock_threshold: "5",
        track_inventory: true,
        weight_grams: "",
        is_active: true,
      });
    }
  }, [variant, open]);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      sku: form.sku,
      variant_name: form.variant_name || undefined,
      price: form.price,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
      track_inventory: form.track_inventory,
      weight_grams: form.weight_grams ? parseInt(form.weight_grams) : undefined,
      is_active: isEdit ? form.is_active : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Variant" : "Add Variant"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="v-name">Variant Name</Label>
              <Input
                id="v-name"
                value={form.variant_name}
                onChange={(e) => handleChange("variant_name", e.target.value)}
                placeholder="e.g. Large, Red"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-sku">SKU *</Label>
              <Input
                id="v-sku"
                value={form.sku}
                onChange={(e) => handleChange("sku", e.target.value)}
                placeholder="Variant SKU"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="v-price">Price (BDT) *</Label>
              <Input
                id="v-price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-stock">Stock Quantity</Label>
              <Input
                id="v-stock"
                type="number"
                min="0"
                value={form.stock_quantity}
                onChange={(e) => handleChange("stock_quantity", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="v-threshold">Low Stock Threshold</Label>
              <Input
                id="v-threshold"
                type="number"
                min="0"
                value={form.low_stock_threshold}
                onChange={(e) => handleChange("low_stock_threshold", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-weight">Weight (grams)</Label>
              <Input
                id="v-weight"
                type="number"
                min="0"
                value={form.weight_grams}
                onChange={(e) => handleChange("weight_grams", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="v-track">Track Inventory</Label>
            <Switch
              id="v-track"
              checked={form.track_inventory}
              onCheckedChange={(v) => handleChange("track_inventory", v)}
            />
          </div>

          {isEdit && (
            <div className="flex items-center justify-between">
              <Label htmlFor="v-active">Active</Label>
              <Switch
                id="v-active"
                checked={form.is_active}
                onCheckedChange={(v) => handleChange("is_active", v)}
              />
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
              {isPending ? "Saving..." : isEdit ? "Update" : "Add Variant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
