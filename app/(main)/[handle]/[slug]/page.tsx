import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { ProfileBlockType } from "@/types";
import ProfileTabsWrapper from "../profile-tabs-wrapper";

type Params = Promise<{ handle: string; slug: string }>;

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
  profile_blocks?: ProfileBlockType[];
  default_page_type?: string;
  default_page_id?: string;
}

export default async function ProfilePageWithSlug({
  params,
}: {
  params: Params;
}) {
  const resolvedParams = await params;
  const { handle, slug } = resolvedParams;
  const supabase = await createClient();

  // Fetch the profile data
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

  // Find the requested page by slug
  const targetPage = pages?.find((page) => page.slug === slug);
  if (!targetPage) return notFound();

  // Get the default page (first page)
  const defaultPage = pages?.length ? pages[0] : null;

  // Fetch blocks for the target page
  const { data: pageBlocks, error: blocksError } = await supabase
    .from("profile_blocks")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("page_id", targetPage.id)
    .order("display_order", { ascending: true });

  if (blocksError) {
    console.error("Error fetching page blocks:", blocksError);
  }

  // Sort blocks by order
  const sortedBlocks = pageBlocks || [];

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

          <div className="mt-8 w-full">
            <ProfileTabsWrapper
              profileId={profile.id}
              defaultBlocks={sortedBlocks}
              activePage={targetPage}
              defaultPage={defaultPage}
              activeTab={targetPage.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
