"use client";

/**
 * Composite provider that nests all client-side providers.
 */

import type { ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { AuthProvider } from "./auth-provider";
import { ToastProvider } from "./toast-provider";

export function Providers({ children }: { children: ReactNode }) {
  /** Wraps children with Query, Auth, and Toast providers. */
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <ToastProvider />
      </AuthProvider>
    </QueryProvider>
  );
}
