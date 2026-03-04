/** Dashboard settings page. */

import { SettingsPage } from "@/components/dashboard/settings-page";

export default async function DashboardSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SettingsPage slug={slug} />;
}
