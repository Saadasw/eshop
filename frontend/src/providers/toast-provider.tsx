"use client";

/**
 * Sonner toast notification provider.
 */

import { Toaster } from "@/components/ui/sonner";

export function ToastProvider() {
  /** Renders the Sonner toast container. */
  return <Toaster richColors position="top-right" />;
}
