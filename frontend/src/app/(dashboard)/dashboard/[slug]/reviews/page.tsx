/** Dashboard reviews page. */

import { ReviewList } from "@/components/dashboard/review-list";

export default async function DashboardReviewsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ReviewList slug={slug} />;
}
