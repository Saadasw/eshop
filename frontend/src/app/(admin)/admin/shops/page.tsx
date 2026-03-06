/** Admin shop management page. */

import type { Metadata } from "next";
import { ShopManagement } from "@/components/admin/shop-management";

export const metadata: Metadata = {
  title: "Shop Management | Admin | E-Shop",
};

export default function AdminShopsPage() {
  return <ShopManagement />;
}
