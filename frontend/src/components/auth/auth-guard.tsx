"use client";

/**
 * Client-side auth guard that redirects unauthenticated users to login.
 *
 * Wraps protected pages. Shows nothing while auth state is loading,
 * redirects to /login if no user, renders children if authenticated.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { ROUTES } from "@/lib/utils/constants";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  /** Redirects to login if user is not authenticated. */
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(ROUTES.LOGIN);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
