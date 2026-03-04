/** Checkout page for a shop. */

import type { Metadata } from "next";
import { CheckoutPage } from "@/components/storefront/checkout-page";

export const metadata: Metadata = {
  title: "Checkout — E-Shop",
};

export default async function CheckoutRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CheckoutPage slug={slug} />;
}
