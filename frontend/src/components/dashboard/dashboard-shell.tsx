/** Dashboard shell with sidebar, topbar, auth/ownership check, and content area. */

"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useShop } from "@/hooks/use-shops";
import { DashboardSidebar } from "./dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/utils/constants";
import { Menu, X, Store } from "lucide-react";
import Link from "next/link";

interface DashboardShellProps {
  children: ReactNode;
}

/** Extract shop slug from dashboard pathname: /dashboard/{slug}/... */
function extractDashboardSlug(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  return match ? match[1] : null;
}

export function DashboardShell({ children }: DashboardShellProps) {
  /** Wraps dashboard pages with sidebar, topbar, and auth guards. */
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const slug = extractDashboardSlug(pathname);
  const { data: shop, isLoading: shopLoading } = useShop(slug ?? "");

  // Auth loading
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto h-4 w-32" />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    router.push(ROUTES.LOGIN);
    return null;
  }

  // Shop loading
  if (shopLoading || !slug) {
    return (
      <div className="flex h-screen">
        <div className="hidden w-56 border-r lg:block">
          <Skeleton className="m-4 h-8 w-40" />
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-64" />
        </div>
      </div>
    );
  }

  // Not shop owner
  if (!shop || shop.owner_id !== user.user_id) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don&apos;t have permission to manage this shop.
        </p>
        <Button asChild>
          <Link href={ROUTES.HOME}>Go Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-shrink-0 border-r lg:flex lg:flex-col">
        <div className="flex h-14 items-center gap-2 px-4">
          <Store className="h-5 w-5 text-primary" />
          <span className="truncate font-semibold">{shop.shop_name}</span>
        </div>
        <Separator />
        <DashboardSidebar slug={slug} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-background shadow-lg">
            <div className="flex h-14 items-center justify-between px-4">
              <span className="truncate font-semibold">{shop.shop_name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Separator />
            <DashboardSidebar slug={slug} onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link
              href={ROUTES.SHOP(slug)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View Storefront
            </Link>
          </div>
          <span className="text-sm text-muted-foreground">
            {user.full_name}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
