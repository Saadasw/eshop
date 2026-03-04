/** Shop discovery page — lists all active shops. */

import type { Metadata } from "next";
import { ShopListPage } from "@/components/storefront/shop-list-page";

export const metadata: Metadata = {
  title: "Browse Shops — E-Shop",
  description: "Discover local shops in Khilgaon, Dhaka on E-Shop.",
};

export default function ShopsPage() {
  return <ShopListPage />;
}
