import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="rcmds" className="mb-8">
        <TabsList>
          <Link href="/explore/rcmds">
            <TabsTrigger value="rcmds">RCMDs</TabsTrigger>
          </Link>
          <Link href="/explore/people">
            <TabsTrigger value="people">People</TabsTrigger>
          </Link>
          <Link href="/explore/creators">
            <TabsTrigger value="creators">Content Creators</TabsTrigger>
          </Link>
          <Link href="/explore/businesses">
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
          </Link>
        </TabsList>
      </Tabs>
      {children}
    </div>
  );
}
