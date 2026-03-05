import { PayoutList } from "@/components/dashboard/payout-list";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PayoutList slug={slug} />;
}
