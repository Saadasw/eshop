/** Storefront layout with navbar and main content container. */

import { Navbar } from "@/components/storefront/navbar";
import type { ReactNode } from "react";

export default function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </>
  );
}
