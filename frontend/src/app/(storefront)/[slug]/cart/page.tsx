/** Cart page for a shop. */

import type { Metadata } from "next";
import { CartPage } from "@/components/storefront/cart-page";

export const metadata: Metadata = {
  title: "Cart — E-Shop",
};

export default async function CartRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CartPage slug={slug} />;
}
