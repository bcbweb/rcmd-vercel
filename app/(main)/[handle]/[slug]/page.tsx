import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { ProfileBlockType } from "@/types";
import PublicProfileBlocks from "@/components/features/profile/public/profile-blocks";

// Set revalidation period for ISR (10 minutes)
export const revalidate = 600;

// Define enhancedBlock type that extends ProfileBlockType
interface EnhancedBlock extends ProfileBlockType {
  rcmds?: Record<string, unknown>;
}

type Params = { handle: string; slug: string };

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  bio?: string;
  profile_picture_url?: string;
  cover_image?: string;
  handle?: string;
  location?: string;
  interests?: string[];
  tags?: string[];
  default_page_type?: string;
  default_page_id?: string;
}

export default async function ProfileCustomPage({
  params,
}: {
  params: Params;
}) {
  // Await the params destructuring to ensure it's ready
  const { handle, slug } = await Promise.resolve(params);
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

  // Find the current page by slug
  const currentPage = pages?.find((page) => page.slug === slug);
  if (!currentPage) return notFound();

  // Fetch RCMD entities directly
  const { data: rcmds, error: rcmdsError } = await supabase
    .from("rcmds")
    .select("*")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: true });

  if (rcmdsError) {
    console.error("Error fetching RCMDs:", rcmdsError);
  }

  // Fetch blocks for current page
  const { data: pageBlocks, error: blocksError } = await supabase
    .from("profile_blocks")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("page_id", currentPage.id)
    .order("display_order", { ascending: true });

  if (blocksError) {
    console.error("Error fetching page blocks:", blocksError);
  }

  // Enhance RCMD blocks with their RCMD data
  const enhancedBlocks = (pageBlocks || []).map((block) => {
    if (block.type === "rcmd" && block.entity_id) {
      const rcmd = rcmds?.find((r) => r.id === block.entity_id);
      if (rcmd) {
        return {
          ...block,
          rcmds: rcmd,
        } as EnhancedBlock;
      }
    }
    return block;
  });

  // Track view count
  await supabase.rpc("increment_profile_view", { profile_id: profile.id });

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

          {/* Simple static navigation bar */}
          <div className="mt-8 mb-6">
            <nav className="flex justify-center">
              <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center gap-1 shadow-sm">
                <Link href={`/${handle}/rcmds`}>
                  <div className="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
                    RCMDs
                  </div>
                </Link>
                <Link href={`/${handle}/links`}>
                  <div className="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
                    Links
                  </div>
                </Link>
                <Link href={`/${handle}/collections`}>
                  <div className="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
                    Collections
                  </div>
                </Link>
              </div>
            </nav>
          </div>

          <div className="w-full">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl font-semibold mb-4">{currentPage.name}</h2>

              {enhancedBlocks.length > 0 ? (
                <PublicProfileBlocks blocks={enhancedBlocks} />
              ) : (
                <div className="text-center py-10 text-gray-500">
                  This page doesn't have any content yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
