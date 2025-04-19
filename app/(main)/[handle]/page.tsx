import { createClient } from "@/utils/supabase/server";
import { createClient as createClientFromEnv } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Image from "next/image";
import ProfileTabsServer from "@/components/features/profile/public/profile-tabs-server";
import { ProfileBlockType } from "@/types";
import type { Profile, ProfilePage } from "@/types";

// Set revalidation period (reduced to 60 seconds for more frequent updates)
export const revalidate = 60;

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

  // Find all pages
  const { data: pages, error: pagesError } = await supabase
    .from("profile_pages")
    .select("id, name, slug")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: true });

  if (pagesError) {
    console.error("Error fetching profile pages:", pagesError);
  }

  // Determine the default page based on profile settings
  let defaultPage = null;

  // Check if default page type is set
  if (profile.default_page_type) {
    if (profile.default_page_type === "custom" && profile.default_page_id) {
      // For custom pages, find the specific page by ID
      defaultPage =
        pages?.find((page) => page.id === profile.default_page_id) || null;
    }
    // For non-custom pages, the main route displays the content directly based on default_page_type
    // so defaultPage remains null for rcmd, link, collection types
  } else {
    // Fallback to the first page if no default is set
    defaultPage = pages?.length ? pages[0] : null;
  }

  // Fetch RCMD entities directly
  const { data: rcmds, error: rcmdsError } = await supabase
    .from("rcmds")
    .select("*")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: true });

  console.log("RCMDs from default route: ", rcmds);

  if (rcmdsError) {
    console.error("Error fetching RCMDs:", rcmdsError);
  }

  // Fetch links directly
  const { data: links, error: linksError } = await supabase
    .from("links")
    .select("*")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: true });

  if (linksError) {
    console.error("Error fetching links:", linksError);
  }

  // Fetch collections directly
  const { data: collections, error: collectionsError } = await supabase
    .from("collections")
    .select("*")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: true });

  if (collectionsError) {
    console.error("Error fetching collections:", collectionsError);
  }

  // Create correctly structured data for the ProfileTabsServer component
  const rcmdBlocks = rcmds || [];
  const linkBlocks = links || [];
  const collectionBlocks = collections || [];

  // Fetch all page blocks to avoid client-side fetching
  const allPageBlocks: Record<string, ProfileBlockType[]> = {};

  // Fetch blocks for all pages
  if (pages && pages.length > 0) {
    for (const page of pages) {
      const { data: pageBlocks } = await supabase
        .from("profile_blocks")
        .select("*")
        .eq("profile_id", profile.id)
        .eq("page_id", page.id)
        .order("display_order", { ascending: true });

      allPageBlocks[page.id] = pageBlocks || [];
    }
  }

  // Track view count (for static params generation)
  await supabase.rpc("increment_profile_view", { profile_id: profile.id });

  // Format pages for server component
  const formattedPages =
    pages?.map((page) => ({
      ...page,
      profile_id: profile.id,
    })) || [];

  const formattedDefaultPage = defaultPage
    ? {
        ...defaultPage,
        profile_id: profile.id,
      }
    : null;

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
          Default route
          <div className="mt-8 w-full">
            <ProfileTabsServer
              handle={handle}
              pages={formattedPages}
              defaultPage={formattedDefaultPage}
              pageBlocks={allPageBlocks}
              rcmdBlocks={rcmdBlocks}
              linkBlocks={linkBlocks}
              collectionBlocks={collectionBlocks}
              defaultPageType={profile.default_page_type || "custom"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
