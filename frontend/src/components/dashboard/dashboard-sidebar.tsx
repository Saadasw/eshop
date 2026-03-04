/** Dashboard sidebar navigation with active state based on pathname. */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/utils/constants";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Settings,
} from "lucide-react";

interface DashboardSidebarProps {
  slug: string;
  onNavigate?: () => void;
}

const NAV_ITEMS = [
  { label: "Home", icon: LayoutDashboard, href: (s: string) => ROUTES.DASHBOARD(s) },
  { label: "Orders", icon: ShoppingBag, href: (s: string) => ROUTES.DASHBOARD_ORDERS(s) },
  { label: "Products", icon: Package, href: (s: string) => ROUTES.DASHBOARD_PRODUCTS(s) },
  { label: "Categories", icon: FolderTree, href: (s: string) => ROUTES.DASHBOARD_CATEGORIES(s) },
  { label: "Settings", icon: Settings, href: (s: string) => ROUTES.DASHBOARD_SETTINGS(s) },
];

export function DashboardSidebar({ slug, onNavigate }: DashboardSidebarProps) {
  /** Renders vertical nav links highlighting the active section. */
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-2">
      {NAV_ITEMS.map((item) => {
        const href = item.href(slug);
        const isActive =
          item.label === "Home"
            ? pathname === href
            : pathname.startsWith(href);

        return (
          <Link
            key={item.label}
            href={href}
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
