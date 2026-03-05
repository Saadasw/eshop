/** Typed API wrappers for notification operations. */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type {
  NotificationRead,
  UnreadCountResponse,
  PaginatedResponse,
} from "@/types/database";

/** List notifications for the current user. */
export async function listNotifications(
  params?: { skip?: number; limit?: number; unread_only?: boolean },
): Promise<PaginatedResponse<NotificationRead>> {
  const response = await api.get<PaginatedResponse<NotificationRead>>(
    API_ROUTES.NOTIFICATIONS,
    { params },
  );
  return response.data;
}

/** Get unread notification count. */
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const response = await api.get<UnreadCountResponse>(
    API_ROUTES.NOTIFICATIONS_UNREAD_COUNT,
  );
  return response.data;
}

/** Mark a single notification as read. */
export async function markNotificationRead(
  notificationId: string,
): Promise<NotificationRead> {
  const response = await api.patch<NotificationRead>(
    API_ROUTES.NOTIFICATION_READ(notificationId),
  );
  return response.data;
}

/** Mark all notifications as read. */
export async function markAllNotificationsRead(): Promise<{ marked_read: number }> {
  const response = await api.post<{ marked_read: number }>(
    API_ROUTES.NOTIFICATIONS_MARK_ALL_READ,
  );
  return response.data;
}
