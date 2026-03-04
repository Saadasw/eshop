/** Dashboard settings page with tabbed sections: General, Config, Delivery, Payments, Staff. */

"use client";

import { useState } from "react";
import { useShop } from "@/hooks/use-shops";
import {
  useShopConfig,
  useUpdateShopConfig,
  useUpdateShopInfo,
  useDeliveryZones,
  useCreateDeliveryZone,
  useUpdateDeliveryZone,
  useDeleteDeliveryZone,
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useStaffList,
  useCreateStaff,
  useUpdateStaff,
  useRemoveStaff,
} from "@/hooks/use-dashboard-settings";
import { DeliveryZoneFormDialog } from "./delivery-zone-form-dialog";
import { PaymentMethodFormDialog } from "./payment-method-form-dialog";
import { StaffFormDialog } from "./staff-form-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatBDT } from "@/lib/utils/format";
import { toast } from "sonner";
import type {
  DeliveryZoneRead,
  ShopPaymentMethodRead,
  StaffRead,
} from "@/types/database";

interface SettingsPageProps {
  slug: string;
}

export function SettingsPage({ slug }: SettingsPageProps) {
  /** Renders tabbed settings with separate CRUD for each section. */
  const { data: shop } = useShop(slug);
  const { data: config, isLoading: configLoading } = useShopConfig(slug);
  const updateConfig = useUpdateShopConfig(slug);
  const updateShopInfo = useUpdateShopInfo(slug);

  // --- General tab state ---
  const [generalForm, setGeneralForm] = useState<{
    shop_name: string;
    description: string;
    contact_email: string;
    contact_phone: string;
  } | null>(null);

  // Initialize general form when shop data loads
  if (shop && !generalForm) {
    setGeneralForm({
      shop_name: shop.shop_name,
      description: shop.description ?? "",
      contact_email: shop.contact_email ?? "",
      contact_phone: shop.contact_phone ?? "",
    });
  }

  const handleSaveGeneral = () => {
    if (!generalForm) return;
    updateShopInfo.mutate(
      {
        shop_name: generalForm.shop_name,
        description: generalForm.description || undefined,
        contact_email: generalForm.contact_email || undefined,
        contact_phone: generalForm.contact_phone || undefined,
      },
      {
        onSuccess: () => toast.success("Shop info updated"),
        onError: () => toast.error("Failed to update shop info"),
      },
    );
  };

  // --- Config tab ---
  const handleConfigToggle = (field: string, value: boolean) => {
    updateConfig.mutate(
      { [field]: value },
      {
        onSuccess: () => toast.success("Setting updated"),
        onError: () => toast.error("Failed to update setting"),
      },
    );
  };

  // --- Delivery zones ---
  const { data: zones } = useDeliveryZones(slug);
  const createZone = useCreateDeliveryZone(slug);
  const updateZone = useUpdateDeliveryZone(slug);
  const deleteZone = useDeleteDeliveryZone(slug);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZoneRead | undefined>();
  const [deleteZoneId, setDeleteZoneId] = useState<string | null>(null);

  // --- Payment methods ---
  const { data: paymentMethods } = usePaymentMethods(slug);
  const createPM = useCreatePaymentMethod(slug);
  const updatePM = useUpdatePaymentMethod(slug);
  const [pmDialogOpen, setPmDialogOpen] = useState(false);
  const [editingPM, setEditingPM] = useState<ShopPaymentMethodRead | undefined>();

  // --- Staff ---
  const { data: staff } = useStaffList(slug);
  const createStaffMember = useCreateStaff(slug);
  const updateStaffMember = useUpdateStaff(slug);
  const removeStaffMember = useRemoveStaff(slug);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffRead | undefined>();
  const [removeStaffId, setRemoveStaffId] = useState<string | null>(null);

  if (configLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shop Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {generalForm && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Shop Name</Label>
                      <Input
                        value={generalForm.shop_name}
                        onChange={(e) =>
                          setGeneralForm({ ...generalForm, shop_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Phone</Label>
                      <Input
                        value={generalForm.contact_phone}
                        onChange={(e) =>
                          setGeneralForm({ ...generalForm, contact_phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      value={generalForm.contact_email}
                      onChange={(e) =>
                        setGeneralForm({ ...generalForm, contact_email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={generalForm.description}
                      onChange={(e) =>
                        setGeneralForm({ ...generalForm, description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleSaveGeneral}
                    disabled={updateShopInfo.isPending}
                  >
                    {updateShopInfo.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Config */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shop Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {config && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Accepting Orders</p>
                      <p className="text-sm text-muted-foreground">
                        Allow customers to place orders
                      </p>
                    </div>
                    <Switch
                      checked={config.accepting_orders}
                      onCheckedChange={(v) => handleConfigToggle("accepting_orders", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto Accept Orders</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically confirm new orders
                      </p>
                    </div>
                    <Switch
                      checked={config.auto_accept_orders}
                      onCheckedChange={(v) => handleConfigToggle("auto_accept_orders", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delivery Enabled</p>
                      <p className="text-sm text-muted-foreground">
                        Enable delivery for orders
                      </p>
                    </div>
                    <Switch
                      checked={config.delivery_enabled}
                      onCheckedChange={(v) => handleConfigToggle("delivery_enabled", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Tax Inclusive</p>
                      <p className="text-sm text-muted-foreground">
                        Prices include tax
                      </p>
                    </div>
                    <Switch
                      checked={config.tax_inclusive}
                      onCheckedChange={(v) => handleConfigToggle("tax_inclusive", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                    </div>
                    <Switch
                      checked={config.sms_notifications_enabled}
                      onCheckedChange={(v) => handleConfigToggle("sms_notifications_enabled", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                    </div>
                    <Switch
                      checked={config.email_notifications_enabled}
                      onCheckedChange={(v) => handleConfigToggle("email_notifications_enabled", v)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Zones */}
        <TabsContent value="delivery">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Delivery Zones</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingZone(undefined);
                  setZoneDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Zone
              </Button>
            </CardHeader>
            <CardContent>
              {!zones || zones.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No delivery zones configured.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zone Name</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>Est. Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {zones.map((zone) => (
                        <TableRow key={zone.zone_id}>
                          <TableCell className="font-medium">
                            {zone.zone_name}
                          </TableCell>
                          <TableCell>{formatBDT(zone.delivery_fee)}</TableCell>
                          <TableCell>
                            {zone.estimated_time_minutes
                              ? `${zone.estimated_time_minutes} min`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={zone.is_active ? "default" : "secondary"}>
                              {zone.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingZone(zone);
                                  setZoneDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteZoneId(zone.zone_id)}
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
              )}
            </CardContent>
          </Card>

          <DeliveryZoneFormDialog
            open={zoneDialogOpen}
            onOpenChange={(open) => {
              setZoneDialogOpen(open);
              if (!open) setEditingZone(undefined);
            }}
            zone={editingZone}
            isPending={createZone.isPending || updateZone.isPending}
            onSubmit={(data) => {
              if (editingZone) {
                updateZone.mutate(
                  { zoneId: editingZone.zone_id, data },
                  {
                    onSuccess: () => { toast.success("Zone updated"); setZoneDialogOpen(false); },
                    onError: () => toast.error("Failed to update zone"),
                  },
                );
              } else {
                createZone.mutate(data, {
                  onSuccess: () => { toast.success("Zone created"); setZoneDialogOpen(false); },
                  onError: () => toast.error("Failed to create zone"),
                });
              }
            }}
          />

          <ConfirmDialog
            open={!!deleteZoneId}
            onOpenChange={(open) => !open && setDeleteZoneId(null)}
            title="Delete Delivery Zone"
            description="Are you sure you want to delete this delivery zone?"
            confirmLabel="Delete"
            isPending={deleteZone.isPending}
            onConfirm={() => {
              if (deleteZoneId) {
                deleteZone.mutate(deleteZoneId, {
                  onSuccess: () => { toast.success("Zone deleted"); setDeleteZoneId(null); },
                  onError: () => toast.error("Failed to delete zone"),
                });
              }
            }}
          />
        </TabsContent>

        {/* Payment Methods */}
        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Payment Methods</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingPM(undefined);
                  setPmDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Method
              </Button>
            </CardHeader>
            <CardContent>
              {!paymentMethods || paymentMethods.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No payment methods configured.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Method</TableHead>
                        <TableHead>Display Account</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-16">Edit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentMethods.map((pm) => (
                        <TableRow key={pm.spm_id}>
                          <TableCell className="font-medium capitalize">
                            {pm.method === "cod"
                              ? "Cash on Delivery"
                              : pm.method}
                          </TableCell>
                          <TableCell>
                            {pm.display_account ?? (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={pm.is_enabled ? "default" : "secondary"}>
                              {pm.is_enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingPM(pm);
                                setPmDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <PaymentMethodFormDialog
            open={pmDialogOpen}
            onOpenChange={(open) => {
              setPmDialogOpen(open);
              if (!open) setEditingPM(undefined);
            }}
            paymentMethod={editingPM}
            isPending={createPM.isPending || updatePM.isPending}
            onSubmit={(result) => {
              if (result.isNew) {
                createPM.mutate(result.data, {
                  onSuccess: () => { toast.success("Payment method added"); setPmDialogOpen(false); },
                  onError: () => toast.error("Failed to add payment method"),
                });
              } else if (editingPM) {
                updatePM.mutate(
                  { spmId: editingPM.spm_id, data: result.data },
                  {
                    onSuccess: () => { toast.success("Payment method updated"); setPmDialogOpen(false); },
                    onError: () => toast.error("Failed to update"),
                  },
                );
              }
            }}
          />
        </TabsContent>

        {/* Staff */}
        <TabsContent value="staff">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Staff Members</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingStaff(undefined);
                  setStaffDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Staff
              </Button>
            </CardHeader>
            <CardContent>
              {!staff || staff.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No staff members added.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.map((s) => (
                        <TableRow key={s.staff_id}>
                          <TableCell className="font-mono text-sm">
                            {s.user_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="capitalize">{s.role.replace("_", " ")}</TableCell>
                          <TableCell>
                            <Badge variant={s.is_active ? "default" : "secondary"}>
                              {s.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingStaff(s);
                                  setStaffDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setRemoveStaffId(s.staff_id)}
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
              )}
            </CardContent>
          </Card>

          <StaffFormDialog
            open={staffDialogOpen}
            onOpenChange={(open) => {
              setStaffDialogOpen(open);
              if (!open) setEditingStaff(undefined);
            }}
            staff={editingStaff}
            isPending={createStaffMember.isPending || updateStaffMember.isPending}
            onSubmit={(result) => {
              if (result.isNew) {
                createStaffMember.mutate(result.data, {
                  onSuccess: () => { toast.success("Staff added"); setStaffDialogOpen(false); },
                  onError: () => toast.error("Failed to add staff"),
                });
              } else if (editingStaff) {
                updateStaffMember.mutate(
                  { staffId: editingStaff.staff_id, data: result.data },
                  {
                    onSuccess: () => { toast.success("Staff updated"); setStaffDialogOpen(false); },
                    onError: () => toast.error("Failed to update staff"),
                  },
                );
              }
            }}
          />

          <ConfirmDialog
            open={!!removeStaffId}
            onOpenChange={(open) => !open && setRemoveStaffId(null)}
            title="Remove Staff Member"
            description="Are you sure you want to remove this staff member?"
            confirmLabel="Remove"
            isPending={removeStaffMember.isPending}
            onConfirm={() => {
              if (removeStaffId) {
                removeStaffMember.mutate(removeStaffId, {
                  onSuccess: () => { toast.success("Staff removed"); setRemoveStaffId(null); },
                  onError: () => toast.error("Failed to remove staff"),
                });
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
