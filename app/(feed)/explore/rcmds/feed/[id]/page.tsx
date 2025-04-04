import { RCMDFeed } from "@/components/features/rcmd";

type Params = Promise<{ id: string; }>;

export default async function RCMDFeedPage({
  params
}: {
  params: Params;
}) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  return <RCMDFeed currentId={id} />;
}