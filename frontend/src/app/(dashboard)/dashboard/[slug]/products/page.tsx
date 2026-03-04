/** Dashboard products list page. */

import { ProductList } from "@/components/dashboard/product-list";

export default async function DashboardProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductList slug={slug} />;
}
