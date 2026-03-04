/** Dashboard home page. */

import { DashboardHome } from "@/components/dashboard/dashboard-home";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <DashboardHome slug={slug} />;
}
