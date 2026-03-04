/** Shop storefront page — shows products with filters. */

import { ShopStorefront } from "@/components/storefront/shop-storefront";

export default async function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ShopStorefront slug={slug} />;
}
