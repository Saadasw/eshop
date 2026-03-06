/** Admin shell with sidebar, topbar, and admin role guard. */

"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { AdminSidebar } from "./admin-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/utils/constants";
import { Menu, X, Shield } from "lucide-react";
import Link from "next/link";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  /** Wraps admin pages with sidebar, topbar, and admin role check. */
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    router.push(ROUTES.LOGIN);
    return null;
  }

  if (user.primary_role !== "admin") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You need admin privileges to access this page.
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
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold">Admin Panel</span>
        </div>
        <Separator />
        <AdminSidebar />
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
              <span className="font-semibold">Admin Panel</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Separator />
            <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
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
              href={ROUTES.HOME}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View Site
            </Link>
          </div>
          <span className="text-sm text-muted-foreground">
            {user.full_name}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
