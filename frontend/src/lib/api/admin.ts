/** Typed API wrappers for admin operations. */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type {
  AdminDashboardStats,
  AuditLogRead,
  PaginatedResponse,
  PayoutCreate,
  PayoutRead,
  PayoutStatusUpdate,
  PlatformSettingRead,
  PlatformSettingUpdate,
  ShopAdminRead,
  ShopApprovalRequest,
  ShopStatus,
  UserAdminRead,
  UserAdminUpdate,
  UserRole,
  AuditAction,
} from "@/types/database";

/** Fetch admin dashboard stats. */
export async function getAdminStats(): Promise<AdminDashboardStats> {
  const response = await api.get<AdminDashboardStats>(API_ROUTES.ADMIN.STATS);
  return response.data;
}

/** List shops for admin management. */
export async function listAdminShops(params?: {
  skip?: number;
  limit?: number;
  status?: ShopStatus;
  search?: string;
}): Promise<PaginatedResponse<ShopAdminRead>> {
  const response = await api.get<PaginatedResponse<ShopAdminRead>>(
    API_ROUTES.ADMIN.SHOPS,
    { params },
  );
  return response.data;
}

/** Update a shop's status (approve, reject, suspend, ban). */
export async function updateShopStatus(
  shopId: string,
  data: ShopApprovalRequest,
): Promise<ShopAdminRead> {
  const response = await api.patch<ShopAdminRead>(
    API_ROUTES.ADMIN.SHOP_STATUS(shopId),
    data,
  );
  return response.data;
}

/** List users for admin management. */
export async function listAdminUsers(params?: {
  skip?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
  is_active?: boolean;
}): Promise<PaginatedResponse<UserAdminRead>> {
  const response = await api.get<PaginatedResponse<UserAdminRead>>(
    API_ROUTES.ADMIN.USERS,
    { params },
  );
  return response.data;
}

/** Update a user's active status or role. */
export async function updateAdminUser(
  userId: string,
  data: UserAdminUpdate,
): Promise<UserAdminRead> {
  const response = await api.patch<UserAdminRead>(
    API_ROUTES.ADMIN.USER(userId),
    data,
  );
  return response.data;
}

/** List all platform settings. */
export async function listSettings(): Promise<PlatformSettingRead[]> {
  const response = await api.get<PlatformSettingRead[]>(
    API_ROUTES.ADMIN.SETTINGS,
  );
  return response.data;
}

/** Create or update a platform setting. */
export async function upsertSetting(
  key: string,
  data: PlatformSettingUpdate,
): Promise<PlatformSettingRead> {
  const response = await api.put<PlatformSettingRead>(
    API_ROUTES.ADMIN.SETTING(key),
    data,
  );
  return response.data;
}

/** List audit logs with optional filters. */
export async function listAuditLogs(params?: {
  skip?: number;
  limit?: number;
  entity_type?: string;
  action?: AuditAction;
  user_id?: string;
  shop_id?: string;
}): Promise<PaginatedResponse<AuditLogRead>> {
  const response = await api.get<PaginatedResponse<AuditLogRead>>(
    API_ROUTES.ADMIN.AUDIT_LOGS,
    { params },
  );
  return response.data;
}

/** Create a payout for a shop (admin only). */
export async function createPayout(data: PayoutCreate): Promise<PayoutRead> {
  const response = await api.post<PayoutRead>(
    API_ROUTES.ADMIN.PAYOUTS,
    data,
  );
  return response.data;
}

/** Update payout status (admin only). */
export async function updatePayoutStatus(
  payoutId: string,
  data: PayoutStatusUpdate,
): Promise<PayoutRead> {
  const response = await api.patch<PayoutRead>(
    API_ROUTES.ADMIN.PAYOUT(payoutId),
    data,
  );
  return response.data;
}
