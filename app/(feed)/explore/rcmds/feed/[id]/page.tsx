import { RCMDFeed } from "@/components/rcmd-feed";

type Params = Promise<{ id: string; }>;

export default async function ProfileFeedPage({
  params
}: {
  params: Params;
}) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  return <RCMDFeed currentId={id} />;
}