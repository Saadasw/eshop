/** Dialog for adding or editing a staff member. */

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
import type { StaffRead, StaffRole, StaffCreate, StaffUpdate } from "@/types/database";

const STAFF_ROLES: { value: StaffRole; label: string }[] = [
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Cashier" },
  { value: "delivery_boy", label: "Delivery Boy" },
];

type StaffFormData =
  | { isNew: true; data: StaffCreate }
  | { isNew: false; data: StaffUpdate };

interface StaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: StaffRead;
  isPending: boolean;
  onSubmit: (result: StaffFormData) => void;
}

export function StaffFormDialog({
  open,
  onOpenChange,
  staff,
  isPending,
  onSubmit,
}: StaffFormDialogProps) {
  /** Renders form fields for staff member management. */
  const isEdit = !!staff;

  const [form, setForm] = useState({
    user_id: "",
    role: "cashier" as StaffRole,
    is_active: true,
  });

  useEffect(() => {
    if (staff) {
      setForm({
        user_id: staff.user_id,
        role: staff.role,
        is_active: staff.is_active,
      });
    } else {
      setForm({
        user_id: "",
        role: "cashier",
        is_active: true,
      });
    }
  }, [staff, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      onSubmit({
        isNew: false,
        data: {
          role: form.role,
          is_active: form.is_active,
        },
      });
    } else {
      onSubmit({
        isNew: true,
        data: {
          user_id: form.user_id,
          role: form.role,
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Staff" : "Add Staff Member"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label>User ID *</Label>
              <Input
                value={form.user_id}
                onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                placeholder="UUID of the user to add as staff"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Role *</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: v as StaffRole })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isEdit && (
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Update" : "Add Staff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
