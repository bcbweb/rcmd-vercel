import { CreatorFeed } from "@/components/features/profile";

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