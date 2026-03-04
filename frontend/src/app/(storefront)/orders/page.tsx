/** Order history page — lists user's orders across all shops. */

import type { Metadata } from "next";
import { OrderListPage } from "@/components/storefront/order-list-page";

export const metadata: Metadata = {
  title: "My Orders — E-Shop",
};

export default function OrdersPage() {
  return <OrderListPage />;
}
