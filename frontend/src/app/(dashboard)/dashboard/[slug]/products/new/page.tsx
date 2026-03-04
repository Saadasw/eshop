/** Dashboard new product page. */

import { ProductForm } from "@/components/dashboard/product-form";

export default async function DashboardNewProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductForm slug={slug} />;
}
