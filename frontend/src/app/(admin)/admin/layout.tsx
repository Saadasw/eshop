/** Admin route group layout — wraps all /admin pages with AdminShell. */

import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
