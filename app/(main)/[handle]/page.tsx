import { createClient } from "@/utils/supabase/server";
import { createClient as createClientFromEnv } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PublicProfileBlocks from "@/components/features/profile/public/profile-blocks";
import { ProfileBlockType } from "@/types";
import type { Profile } from "@/types";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";

// Set revalidation period (reduced to 60 seconds for more frequent updates)
export const revalidate = 60;

// Define an extended block type to fix TypeScript errors
interface ExtendedProfileBlock extends Omit<ProfileBlockType, "page_id"> {
  page_id: string | null;
  entity_id?: string;
  rcmds?: Record<string, unknown>;
  links?: Record<string, unknown>;
  collections?: Record<string, unknown>;
  [key: string]: unknown;
}

// Pre-render popular profiles at build time
export async function generateStaticParams() {
  try {
    // Use a server-side client that doesn't rely on cookies for static generation
    const supabase = createClientFromEnv(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("handle")
      .order("view_count", { ascending: false })
      .limit(20);

    return (
      profiles?.map(({ handle }) => ({
        handle,
      })) || []
    );
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

type Params = { handle: string };

export default async function ProfilePage({ params }: { params: Params }) {
  // Await the params destructuring to ensure it's ready
  const { handle } = await Promise.resolve(params);
  const supabase = await createClient();

  // Fetch the profile data with default page information
  const { data: profile } = (await supabase
    .from("profiles")
    .select(
      `
      id,
      first_name,
      last_name,
      bio,
      profile_picture_url,
      cover_image,
      handle,
      location,
      interests,
      tags,
      default_page_type,
      default_page_id
    `
    )
    .eq("handle", handle)
    .single()) as { data: Profile | null; error: unknown };

  if (!profile) return notFound();

  // Fetch all pages for navigation
  const { data: pages } = await supabase
    .from("profile_pages")
    .select("id, name, slug")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: true });

  // Track view count
  await supabase.rpc("increment_profile_view", { profile_id: profile.id });

  // Define default page type to properly set the active tab
  let defaultPageType: "rcmd" | "link" | "collection" | "custom" = "rcmd"; // Default to rcmd if no default page is set

  if (profile.default_page_type) {
    defaultPageType = profile.default_page_type as
      | "rcmd"
      | "link"
      | "collection"
      | "custom";
  }

  // Get default page blocks if the default page type is custom
  const defaultPage =
    defaultPageType === "custom" && profile.default_page_id
      ? pages?.find((page) => page.id === profile.default_page_id)
      : null;

  // Fetch blocks for the default page
  if (defaultPageType === "custom" && profile.default_page_id) {
    // This was fetched but not used - just commenting out to preserve the logic
    // const { data: blocks } = await supabase
    //   .from("page_blocks")
    //   .select("*")
    //   .eq("page_id", profile.default_page_id)
    //   .order("position");
  }

  // Determine what content to show based on profile settings
  let contentBlocks: ExtendedProfileBlock[] = [];
  let contentTitle = "Profile";

  // For custom page type, fetch the custom page blocks
  if (defaultPageType === "custom" && profile.default_page_id) {
    // Find the default page name
    if (defaultPage) {
      contentTitle = defaultPage.name;
    }

    // Fetch blocks for the default page
    const { data: pageBlocks, error: blocksError } = await supabase
      .from("profile_blocks")
      .select("*")
      .eq("profile_id", profile.id)
      .eq("page_id", profile.default_page_id)
      .order("display_order", { ascending: true });

    if (blocksError) {
      console.error("Error fetching page blocks:", blocksError);
    }

    contentBlocks = (pageBlocks || []) as ExtendedProfileBlock[];

    // If there are RCMD blocks, we need to fetch the RCMD data
    const rcmdBlockIds = contentBlocks
      .filter((block) => block.type === "rcmd" && block.entity_id)
      .map((block) => block.entity_id as string);

    if (rcmdBlockIds.length > 0) {
      const { data: rcmds } = await supabase
        .from("rcmds")
        .select("*")
        .in("id", rcmdBlockIds);

      // Enhance RCMD blocks with their RCMD data
      contentBlocks = contentBlocks.map((block) => {
        if (block.type === "rcmd" && block.entity_id) {
          const rcmd = rcmds?.find((r) => r.id === block.entity_id);
          if (rcmd) {
            return {
              ...block,
              rcmds: rcmd,
            };
          }
        }
        return block;
      });
    }
  }
  // For other page types, fetch those entities directly
  else if (defaultPageType === "rcmd") {
    contentTitle = "RCMDs";
    const { data: rcmds } = await supabase
      .from("rcmds")
      .select("*")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: true });

    // Convert RCMDs to blocks format
    contentBlocks = (rcmds || []).map((rcmd) => ({
      id: rcmd.id,
      type: "rcmd",
      profile_id: profile.id,
      page_id: null,
      display_order: 0,
      show_border: false,
      auth_user_id: profile.id,
      created_at: rcmd.created_at,
      updated_at: rcmd.updated_at,
      entity_id: rcmd.id,
      rcmds: rcmd,
    })) as ExtendedProfileBlock[];
  } else if (defaultPageType === "link") {
    contentTitle = "Links";
    const { data: links } = await supabase
      .from("links")
      .select("*")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: true });

    // Convert Links to blocks format
    contentBlocks = (links || []).map((link) => ({
      id: link.id,
      type: "link",
      profile_id: profile.id,
      page_id: null,
      display_order: 0,
      show_border: false,
      auth_user_id: profile.id,
      created_at: link.created_at,
      updated_at: link.updated_at,
      entity_id: link.id,
      links: link,
    })) as ExtendedProfileBlock[];
  } else if (defaultPageType === "collection") {
    contentTitle = "Collections";
    const { data: collections } = await supabase
      .from("collections")
      .select("*")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: true });

    // Convert Collections to blocks format
    contentBlocks = (collections || []).map((collection) => ({
      id: collection.id,
      type: "collection",
      profile_id: profile.id,
      page_id: null,
      display_order: 0,
      show_border: false,
      auth_user_id: profile.id,
      created_at: collection.created_at,
      updated_at: collection.updated_at,
      entity_id: collection.id,
      collections: collection,
    })) as ExtendedProfileBlock[];
  }

  return (
    <div className="w-full">
      {/* Cover Image Section */}
      <div className="relative w-full h-[250px] md:h-[350px]">
        {profile.cover_image ? (
          <Image
            src={profile.cover_image}
            alt="Profile cover"
            className="object-cover"
            fill
            sizes="100vw"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-100 to-blue-200" />
        )}
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 -mt-16 relative">
        <div className="max-w-[1400px] mx-auto">
          <header className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative -mt-20">
                {profile.profile_picture_url ? (
                  <Image
                    src={profile.profile_picture_url}
                    alt={profile.handle || ""}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white dark:border-gray-800"
                    width={128}
                    height={128}
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 border-4 border-white dark:border-gray-800" />
                )}
              </div>
              <div className="flex-1 pt-4 md:pt-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                      {profile.first_name} {profile.last_name}
                    </h1>
                    {profile.handle && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {profile.handle}
                      </p>
                    )}
                  </div>
                  {profile.location && (
                    <p className="mt-2 md:mt-0 text-gray-600 dark:text-gray-400 text-sm">
                      📍 {profile.location}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {profile.bio && (
              <p className="mt-6 text-gray-700 dark:text-gray-300 text-lg">
                {profile.bio}
              </p>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <div className="mt-4 flex gap-2 flex-wrap">
                {profile.interests.map((interest: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}

            {profile.tags && profile.tags.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {profile.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Profile Navigation */}
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex overflow-x-auto py-2 px-4 pb-1 -mb-px">
              <Link
                href={`/${handle}`}
                className={cn(
                  "flex items-center whitespace-nowrap px-4 py-2 text-sm font-medium",
                  {
                    "bg-accent/30 text-primary rounded-md":
                      defaultPageType === "rcmd",
                    "text-muted-foreground hover:text-foreground":
                      defaultPageType !== "rcmd",
                  }
                )}
              >
                <Icons.rcmd className="mr-2 h-4 w-4" />
                RCMDs
              </Link>
              <Link
                href={`/${handle}/links`}
                className={cn(
                  "flex items-center whitespace-nowrap px-4 py-2 text-sm font-medium",
                  {
                    "bg-accent/30 text-primary rounded-md":
                      defaultPageType === "link",
                    "text-muted-foreground hover:text-foreground":
                      defaultPageType !== "link",
                  }
                )}
              >
                <Icons.link className="mr-2 h-4 w-4" />
                Links
              </Link>
              <Link
                href={`/${handle}/collections`}
                className={cn(
                  "flex items-center whitespace-nowrap px-4 py-2 text-sm font-medium",
                  {
                    "bg-accent/30 text-primary rounded-md":
                      defaultPageType === "collection",
                    "text-muted-foreground hover:text-foreground":
                      defaultPageType !== "collection",
                  }
                )}
              >
                <Icons.collection className="mr-2 h-4 w-4" />
                Collections
              </Link>

              {/* Custom Pages */}
              {pages?.map((page) => (
                <Link
                  key={page.id}
                  href={`/${handle}/${page.slug}`}
                  className={cn(
                    "flex items-center whitespace-nowrap px-4 py-2 text-sm font-medium",
                    {
                      "bg-accent/30 text-primary rounded-md":
                        defaultPageType === "custom" &&
                        profile.default_page_id === page.id,
                      "text-muted-foreground hover:text-foreground": !(
                        defaultPageType === "custom" &&
                        profile.default_page_id === page.id
                      ),
                    }
                  )}
                >
                  <Icons.page className="mr-2 h-4 w-4" />
                  {page.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="w-full">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl font-semibold mb-4">{contentTitle}</h2>

              {contentBlocks.length > 0 ? (
                <PublicProfileBlocks
                  blocks={contentBlocks as ProfileBlockType[]}
                />
              ) : (
                <div className="text-center py-10 text-gray-500">
                  This profile doesn't have any content yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
