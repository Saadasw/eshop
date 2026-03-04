/** Dashboard categories page. */

import { CategoryList } from "@/components/dashboard/category-list";

export default async function DashboardCategoriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CategoryList slug={slug} />;
}
