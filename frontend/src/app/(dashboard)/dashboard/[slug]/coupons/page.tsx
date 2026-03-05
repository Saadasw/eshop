/** Dashboard coupons page. */

import { CouponList } from "@/components/dashboard/coupon-list";

export default async function DashboardCouponsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CouponList slug={slug} />;
}
