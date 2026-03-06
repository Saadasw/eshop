/** Admin payout management page. */

import type { Metadata } from "next";
import { PayoutManagement } from "@/components/admin/payout-management";

export const metadata: Metadata = {
  title: "Payout Management | Admin | E-Shop",
};

export default function AdminPayoutsPage() {
  return <PayoutManagement />;
}
