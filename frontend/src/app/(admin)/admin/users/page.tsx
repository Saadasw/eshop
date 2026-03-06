/** Admin user management page. */

import type { Metadata } from "next";
import { UserManagement } from "@/components/admin/user-management";

export const metadata: Metadata = {
  title: "User Management | Admin | E-Shop",
};

export default function AdminUsersPage() {
  return <UserManagement />;
}
