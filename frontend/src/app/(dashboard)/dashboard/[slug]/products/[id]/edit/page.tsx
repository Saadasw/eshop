/** Dashboard product edit page. */

import { ProductEdit } from "@/components/dashboard/product-edit";

export default async function DashboardProductEditPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  return <ProductEdit slug={slug} productId={id} />;
}
