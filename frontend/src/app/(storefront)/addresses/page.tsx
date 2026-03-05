import type { Metadata } from "next";
import { AddressPage } from "@/components/storefront/address-page";

export const metadata: Metadata = {
  title: "My Addresses | E-Shop",
};

export default function Page() {
  return <AddressPage />;
}
