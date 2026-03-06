/** Admin sidebar navigation with active state based on pathname. */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/utils/constants";
import {
  LayoutDashboard,
  Store,
  Users,
  Settings,
  ScrollText,
  Wallet,
} from "lucide-react";

interface AdminSidebarProps {
  onNavigate?: () => void;
}

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: ROUTES.ADMIN },
  { label: "Shops", icon: Store, href: ROUTES.ADMIN_SHOPS },
  { label: "Users", icon: Users, href: ROUTES.ADMIN_USERS },
  { label: "Payouts", icon: Wallet, href: ROUTES.ADMIN_PAYOUTS },
  { label: "Settings", icon: Settings, href: ROUTES.ADMIN_SETTINGS },
  { label: "Audit Logs", icon: ScrollText, href: ROUTES.ADMIN_AUDIT_LOGS },
];

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  /** Renders vertical nav links highlighting the active section. */
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-2">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.label === "Dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
