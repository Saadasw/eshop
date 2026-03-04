/** Product detail page. */

import { ProductDetail } from "@/components/storefront/product-detail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  return <ProductDetail slug={slug} productId={id} />;
}
