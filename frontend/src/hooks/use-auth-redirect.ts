"use client";

/**
 * Hook that redirects authenticated users away from auth pages.
 *
 * Used on login/register/verify-otp pages so logged-in users
 * are sent to the home page instead.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { ROUTES } from "@/lib/utils/constants";

export function useAuthRedirect() {
  /** Redirects to home if user is already authenticated. */
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(ROUTES.HOME);
    }
  }, [user, isLoading, router]);

  return { isLoading, isAuthenticated: !!user };
}
