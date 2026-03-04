/** Dashboard order detail page. */

import { DashboardOrderDetail } from "@/components/dashboard/order-detail";

export default async function DashboardOrderDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  return <DashboardOrderDetail slug={slug} orderId={id} />;
}
