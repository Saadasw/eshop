/** Admin platform settings page. */

import type { Metadata } from "next";
import { SettingsManagement } from "@/components/admin/settings-management";

export const metadata: Metadata = {
  title: "Platform Settings | Admin | E-Shop",
};

export default function AdminSettingsPage() {
  return <SettingsManagement />;
}
