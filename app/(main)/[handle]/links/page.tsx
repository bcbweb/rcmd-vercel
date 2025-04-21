import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { ProfileBlockType } from "@/types";
import LinkBlocks from "@/components/features/links/link-blocks";

// Set revalidation period for ISR (60 seconds for more frequent updates)
export const revalidate = 60;

type Params = { handle: string };

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

export default async function ProfileLinksPage({ params }: { params: Params }) {
  console.log("Starting fetch for handle:", params.handle);
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
  console.log(`Found profile for ${handle}, profileId: ${profile.id}`);

  try {
    // Find all pages
    const { data: pages, error: pagesError } = await supabase
      .from("profile_pages")
      .select("id, name, slug")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: true });

    if (pagesError) {
      console.error("Error fetching profile pages:", pagesError);
    }

    console.log(`Found ${pages?.length || 0} profile pages`);

    // Primary query - fetch links by profile_id (preferred method)
    const { data: links, error: linksError } = await supabase
      .from("links")
      .select("*")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false });

    if (linksError) {
      console.error("Error fetching links with profile_id:", linksError);
    }

    console.log(`Found ${links?.length || 0} links by profile_id`);

    // If no links found, check for legacy data and migrate it
    let finalLinks = links;
    if (!links || links.length === 0) {
      console.log("No links found with profile_id, checking legacy data");

      // Legacy query - only use if no profile_id records exist
      const { data: legacyLinks, error: legacyError } = await supabase
        .from("links")
        .select("*")
        .eq("owner_id", profile.id)
        .order("created_at", { ascending: false });

      if (legacyError) {
        console.error("Error fetching links with owner_id:", legacyError);
      } else if (legacyLinks && legacyLinks.length > 0) {
        console.log(
          `Found ${legacyLinks.length} legacy links, updating them with profile_id`
        );

        // Update legacy records to include profile_id for future queries
        for (const link of legacyLinks) {
          try {
            await supabase
              .from("links")
              .update({ profile_id: profile.id })
              .eq("id", link.id);

            // Add profile_id to the local record too
            link.profile_id = profile.id;
          } catch (updateError) {
            console.error(`Failed to update link ${link.id}:`, updateError);
          }
        }

        // Use the legacy links for this request
        finalLinks = legacyLinks;
        console.log(
          `Using ${finalLinks.length} legacy links and updating them`
        );
      }
    }

    console.log(`Displaying ${finalLinks?.length || 0} total links`);

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

            <div className="mt-8 w-full">
              {/* Use LinkBlocks component directly with isPublic flag */}
              <LinkBlocks links={finalLinks || []} isPublic={true} />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in ProfileLinksPage:", error);
    return (
      <div className="w-full p-8 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p>We could not load this profile's links. Please try again later.</p>
      </div>
    );
  }
}
