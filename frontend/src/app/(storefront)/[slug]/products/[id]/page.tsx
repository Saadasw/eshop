/** Product detail page — shows product info, gallery, variants, add-to-cart. */

import { ProductDetail } from "@/components/storefront/product-detail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  /** Next.js 16: params is a Promise. */
  const { slug, id } = await params;
  return <ProductDetail slug={slug} productId={id} />;
}
