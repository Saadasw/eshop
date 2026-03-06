/** TanStack Query hooks for admin operations. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAdminStats,
  listAdminShops,
  updateShopStatus,
  listAdminUsers,
  updateAdminUser,
  listSettings,
  upsertSetting,
  listAuditLogs,
  createPayout,
  updatePayoutStatus,
} from "@/lib/api/admin";
import type {
  ShopStatus,
  UserRole,
  AuditAction,
  ShopApprovalRequest,
  UserAdminUpdate,
  PlatformSettingUpdate,
  PayoutCreate,
  PayoutStatusUpdate,
} from "@/types/database";

/** Fetch admin dashboard stats. */
export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: getAdminStats,
  });
}

/** List shops for admin management. */
export function useAdminShops(params?: {
  skip?: number;
  limit?: number;
  status?: ShopStatus;
  search?: string;
}) {
  return useQuery({
    queryKey: ["admin", "shops", params],
    queryFn: () => listAdminShops(params),
  });
}

/** Update shop status mutation. */
export function useUpdateShopStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shopId, data }: { shopId: string; data: ShopApprovalRequest }) =>
      updateShopStatus(shopId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "shops"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("Shop status updated");
    },
    onError: () => toast.error("Failed to update shop status"),
  });
}

/** List users for admin management. */
export function useAdminUsers(params?: {
  skip?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
  is_active?: boolean;
}) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => listAdminUsers(params),
  });
}

/** Update user mutation. */
export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UserAdminUpdate }) =>
      updateAdminUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("User updated");
    },
    onError: () => toast.error("Failed to update user"),
  });
}

/** List platform settings. */
export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: listSettings,
  });
}

/** Upsert setting mutation. */
export function useUpsertSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: PlatformSettingUpdate }) =>
      upsertSetting(key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Setting saved");
    },
    onError: () => toast.error("Failed to save setting"),
  });
}

/** List audit logs with filters. */
export function useAuditLogs(params?: {
  skip?: number;
  limit?: number;
  entity_type?: string;
  action?: AuditAction;
  user_id?: string;
  shop_id?: string;
}) {
  return useQuery({
    queryKey: ["admin", "audit-logs", params],
    queryFn: () => listAuditLogs(params),
  });
}

/** Create payout mutation. */
export function useCreatePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PayoutCreate) => createPayout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payouts"] });
      toast.success("Payout created");
    },
    onError: () => toast.error("Failed to create payout"),
  });
}

/** List admin payouts (reuses admin shops query for shop context). */
export function useAdminPayouts(params?: {
  skip?: number;
  limit?: number;
}) {
  // Admin payouts are listed per-shop via the existing shop payout endpoint
  // but managed via admin endpoints for create/update
  return useQuery({
    queryKey: ["admin", "payouts", params],
    queryFn: () => listAuditLogs(params), // placeholder - payouts are per-shop
    enabled: false, // disabled - admin payouts are managed per-shop
  });
}

/** Update payout status mutation. */
export function useUpdatePayoutStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payoutId, data }: { payoutId: string; data: PayoutStatusUpdate }) =>
      updatePayoutStatus(payoutId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Payout status updated");
    },
    onError: () => toast.error("Failed to update payout status"),
  });
}
