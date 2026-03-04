/** Dialog for creating or editing a delivery zone. */

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
import type { DeliveryZoneRead, DeliveryZoneCreate } from "@/types/database";

interface DeliveryZoneFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone?: DeliveryZoneRead;
  isPending: boolean;
  onSubmit: (data: DeliveryZoneCreate) => void;
}

export function DeliveryZoneFormDialog({
  open,
  onOpenChange,
  zone,
  isPending,
  onSubmit,
}: DeliveryZoneFormDialogProps) {
  /** Renders form fields for delivery zone creation or editing. */
  const isEdit = !!zone;

  const [form, setForm] = useState({
    zone_name: "",
    areas: "",
    delivery_fee: "",
    estimated_time_minutes: "",
    sort_order: "0",
    is_active: true,
  });

  useEffect(() => {
    if (zone) {
      setForm({
        zone_name: zone.zone_name,
        areas: zone.areas.join(", "),
        delivery_fee: zone.delivery_fee,
        estimated_time_minutes: zone.estimated_time_minutes?.toString() ?? "",
        sort_order: zone.sort_order.toString(),
        is_active: zone.is_active,
      });
    } else {
      setForm({
        zone_name: "",
        areas: "",
        delivery_fee: "",
        estimated_time_minutes: "",
        sort_order: "0",
        is_active: true,
      });
    }
  }, [zone, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      zone_name: form.zone_name,
      areas: form.areas.split(",").map((a) => a.trim()).filter(Boolean),
      delivery_fee: form.delivery_fee,
      estimated_time_minutes: form.estimated_time_minutes
        ? parseInt(form.estimated_time_minutes)
        : undefined,
      sort_order: parseInt(form.sort_order) || 0,
      is_active: form.is_active,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Zone" : "Add Delivery Zone"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Zone Name *</Label>
            <Input
              value={form.zone_name}
              onChange={(e) => setForm({ ...form, zone_name: e.target.value })}
              placeholder="e.g. Khilgaon Local"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Areas (comma-separated)</Label>
            <Input
              value={form.areas}
              onChange={(e) => setForm({ ...form, areas: e.target.value })}
              placeholder="e.g. Khilgaon, Bashabo, Mugdapara"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Delivery Fee (BDT) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.delivery_fee}
                onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Estimated Time (minutes)</Label>
              <Input
                type="number"
                min="0"
                value={form.estimated_time_minutes}
                onChange={(e) => setForm({ ...form, estimated_time_minutes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => setForm({ ...form, is_active: v })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
