/** Address management page for customers. */

"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from "@/hooks/use-addresses";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "./empty-state";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { ROUTES } from "@/lib/utils/constants";
import type {
  CustomerAddressRead,
  CustomerAddressCreate,
} from "@/types/database";
import Link from "next/link";
import { toast } from "sonner";

const EMPTY_FORM: CustomerAddressCreate = {
  label: "",
  recipient_name: "",
  phone: "",
  street_address: "",
  area: "",
  city: "Dhaka",
  postal_code: "",
  is_default: false,
};

export function AddressPage() {
  /** Renders address list with create/edit/delete capabilities. */
  const { user, isLoading: authLoading } = useAuth();
  const { data: addresses, isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerAddressCreate>(EMPTY_FORM);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (addr: CustomerAddressRead) => {
    setEditingId(addr.address_id);
    setForm({
      label: addr.label ?? "",
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      street_address: addr.street_address,
      area: addr.area,
      city: addr.city,
      postal_code: addr.postal_code,
      is_default: addr.is_default,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.recipient_name || !form.phone || !form.street_address || !form.area || !form.postal_code) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingId) {
      updateAddress.mutate(
        { addressId: editingId, data: form },
        {
          onSuccess: () => {
            toast.success("Address updated");
            setDialogOpen(false);
          },
          onError: () => toast.error("Failed to update address"),
        },
      );
    } else {
      createAddress.mutate(form, {
        onSuccess: () => {
          toast.success("Address created");
          setDialogOpen(false);
        },
        onError: () => toast.error("Failed to create address"),
      });
    }
  };

  const handleDelete = (addressId: string) => {
    deleteAddress.mutate(addressId, {
      onSuccess: () => toast.success("Address deleted"),
      onError: () => toast.error("Failed to delete address"),
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <EmptyState
        icon={<MapPin className="h-12 w-12" />}
        title="Login to manage addresses"
        action={
          <Button asChild>
            <Link href={ROUTES.LOGIN}>Login</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Addresses</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Address
        </Button>
      </div>

      {!addresses || addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-12 w-12" />}
          title="No addresses saved"
          description="Add a delivery address to speed up checkout."
        />
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <Card key={addr.address_id}>
              <CardContent className="flex items-start justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{addr.recipient_name}</p>
                    {addr.label && (
                      <Badge variant="outline" className="text-xs">
                        {addr.label}
                      </Badge>
                    )}
                    {addr.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {addr.street_address}, {addr.area}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {addr.city} - {addr.postal_code}
                  </p>
                  <p className="text-sm text-muted-foreground">{addr.phone}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(addr)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(addr.address_id)}
                    disabled={deleteAddress.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Address" : "Add Address"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="addr-name">Recipient Name *</Label>
                <Input
                  id="addr-name"
                  value={form.recipient_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, recipient_name: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="addr-phone">Phone *</Label>
                <Input
                  id="addr-phone"
                  placeholder="01XXXXXXXXX"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="addr-street">Street Address *</Label>
              <Input
                id="addr-street"
                value={form.street_address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, street_address: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="addr-area">Area *</Label>
                <Input
                  id="addr-area"
                  value={form.area}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, area: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="addr-city">City</Label>
                <Input
                  id="addr-city"
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="addr-postal">Postal Code *</Label>
                <Input
                  id="addr-postal"
                  value={form.postal_code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, postal_code: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="addr-label">Label</Label>
                <Input
                  id="addr-label"
                  placeholder="Home, Office, etc."
                  value={form.label ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, label: e.target.value || null }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="addr-default"
                checked={form.is_default}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_default: e.target.checked }))
                }
                className="rounded"
              />
              <Label htmlFor="addr-default" className="text-sm">
                Set as default address
              </Label>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={createAddress.isPending || updateAddress.isPending}
              className="w-full"
            >
              {createAddress.isPending || updateAddress.isPending
                ? "Saving..."
                : editingId
                  ? "Update Address"
                  : "Add Address"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
