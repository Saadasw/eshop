/** Admin audit log viewer page. */

import type { Metadata } from "next";
import { AuditLogViewer } from "@/components/admin/audit-log-viewer";

export const metadata: Metadata = {
  title: "Audit Logs | Admin | E-Shop",
};

export default function AdminAuditLogsPage() {
  return <AuditLogViewer />;
}
