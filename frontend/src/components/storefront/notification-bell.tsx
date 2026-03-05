/** Notification bell icon with unread count badge and dropdown. */

"use client";

import { useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useUnreadCount,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
} from "@/hooks/use-notifications";
import { formatDateBST } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function NotificationBell() {
  /** Renders a bell icon with unread count and a dropdown of recent notifications. */
  const [open, setOpen] = useState(false);
  const { data: unreadData } = useUnreadCount();
  const { data: notifications } = useNotifications(
    { limit: 10 },
  );
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const unreadCount = unreadData?.count ?? 0;
  const items = notifications?.items ?? [];

  const handleMarkRead = (notificationId: string) => {
    markRead.mutate(notificationId);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            {items.map((n) => (
              <DropdownMenuItem
                key={n.notification_id}
                className={cn(
                  "flex flex-col items-start gap-1 px-3 py-2",
                  !n.is_read && "bg-primary/5",
                )}
                asChild={!!n.action_url}
              >
                {n.action_url ? (
                  <Link href={n.action_url} onClick={() => !n.is_read && handleMarkRead(n.notification_id)}>
                    <span className="text-sm font-medium">{n.title}</span>
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {n.message}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateBST(n.created_at)}
                    </span>
                  </Link>
                ) : (
                  <div onClick={() => !n.is_read && handleMarkRead(n.notification_id)} className="cursor-pointer w-full">
                    <div className="flex items-start justify-between w-full">
                      <span className="text-sm font-medium">{n.title}</span>
                      {!n.is_read && (
                        <Check className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {n.message}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateBST(n.created_at)}
                    </span>
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
