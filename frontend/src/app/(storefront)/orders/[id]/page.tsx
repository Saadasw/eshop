/** Order detail page. */

import { OrderDetailPage } from "@/components/storefront/order-detail-page";

export default async function OrderRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailPage orderId={id} />;
}
