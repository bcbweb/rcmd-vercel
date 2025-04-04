import { ProfileFeed } from "@/components/features/profile";

type Params = Promise<{ handle: string; }>;

export default async function ProfileFeedPage({
  params
}: {
  params: Params;
}) {
  const resolvedParams = await params;
  const { handle } = resolvedParams;
  return <ProfileFeed currentHandle={handle} />;
}