/** TanStack Query hooks for notification operations. */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api/notifications";

/** List notifications for the current user. */
export function useNotifications(
  params?: { skip?: number; limit?: number; unread_only?: boolean },
) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => listNotifications(params),
  });
}

/** Get unread notification count (polled frequently). */
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: getUnreadCount,
    enabled,
    refetchInterval: 30_000,
  });
}

/** Mark a single notification as read. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });
}

/** Mark all notifications as read. */
export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });
}
