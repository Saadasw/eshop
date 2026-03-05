import { RefundList } from "@/components/dashboard/refund-list";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <RefundList slug={slug} />;
}
