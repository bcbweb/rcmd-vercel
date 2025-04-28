import { ProfileFeed } from "@/components/features/profile";
import { Metadata } from "next";

type PageParams = {
  handle: string;
};

export const metadata: Metadata = {
  title: "Explore People Feed | RCMD",
  description: "Discover and browse through people's profiles on RCMD.",
};

// Define the viewport in a separate export
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function ProfileFeedPage({
  params,
}: {
  params: PageParams;
}) {
  const resolvedParams = await params;
  const { handle } = resolvedParams;
  return <ProfileFeed currentHandle={handle} />;
}
