import { CreatorFeed } from "@/components/creator-feed";

type Params = Promise<{ handle: string; }>;

export default async function CreatorFeedPage({
  params
}: {
  params: Params;
}) {
  const resolvedParams = await params;
  const { handle } = resolvedParams;
  return <CreatorFeed currentHandle={handle} />;
}