/** Admin user management — list users with role/status filter and management actions. */

"use client";

import { useState } from "react";
import { useAdminUsers, useUpdateAdminUser } from "@/hooks/use-admin";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/storefront/pagination";
import { formatDateBST } from "@/lib/utils/format";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";
import type { UserAdminRead, UserRole } from "@/types/database";

const ROLE_OPTIONS: { value: UserRole | "all"; label: string }[] = [
  { value: "all", label: "All Roles" },
  { value: "customer", label: "Customer" },
  { value: "owner", label: "Owner" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
];

const ACTIVE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-800",
  owner: "bg-blue-100 text-blue-800",
  staff: "bg-cyan-100 text-cyan-800",
  customer: "bg-gray-100 text-gray-800",
};

export function UserManagement() {
  /** Renders user list with filters and management actions. */
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [editUser, setEditUser] = useState<UserAdminRead | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("customer");
  const [editActive, setEditActive] = useState(true);

  const { data, isLoading } = useAdminUsers({
    skip: page * DEFAULT_PAGE_SIZE,
    limit: DEFAULT_PAGE_SIZE,
    role: roleFilter === "all" ? undefined : roleFilter,
    search: search || undefined,
    is_active: activeFilter === "all" ? undefined : activeFilter === "true",
  });
  const updateUser = useUpdateAdminUser();

  function openEditDialog(user: UserAdminRead) {
    setEditUser(user);
    setEditRole(user.primary_role);
    setEditActive(user.is_active);
  }

  function confirmUpdate() {
    if (!editUser) return;
    const data: { is_active?: boolean; primary_role?: UserRole } = {};
    if (editActive !== editUser.is_active) data.is_active = editActive;
    if (editRole !== editUser.primary_role) data.primary_role = editRole;
    if (Object.keys(data).length === 0) {
      setEditUser(null);
      return;
    }
    updateUser.mutate(
      { userId: editUser.user_id, data },
      { onSuccess: () => setEditUser(null) },
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Users</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-48"
              />
              <Select
                value={roleFilter}
                onValueChange={(v) => {
                  setRoleFilter(v as UserRole | "all");
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={activeFilter}
                onValueChange={(v) => {
                  setActiveFilter(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVE_OPTIONS.map((opt) => (
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
              No users found.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">
                        {user.full_name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.phone}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={ROLE_COLORS[user.primary_role]}
                        >
                          {user.primary_role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.is_active ? "default" : "destructive"}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.last_login_at
                          ? formatDateBST(user.last_login_at)
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(user)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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

      {/* Edit user dialog */}
      <Dialog
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">{editUser?.full_name}</p>
              <p className="text-sm text-muted-foreground">{editUser?.email}</p>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editRole}
                onValueChange={(v) => setEditRole(v as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editActive ? "true" : "false"}
                onValueChange={(v) => setEditActive(v === "true")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmUpdate}
              disabled={updateUser.isPending}
            >
              {updateUser.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
