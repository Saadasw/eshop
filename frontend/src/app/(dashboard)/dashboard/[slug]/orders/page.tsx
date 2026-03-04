/** Dashboard orders list page. */

import { DashboardOrderList } from "@/components/dashboard/order-list";

export default async function DashboardOrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <DashboardOrderList slug={slug} />;
}
