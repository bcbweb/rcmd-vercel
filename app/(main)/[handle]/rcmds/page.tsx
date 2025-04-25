export const dynamic = "force-dynamic";
export const dynamicParams = true;

import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicRCMDBlocks from "@/components/features/rcmd/public-rcmd-blocks";
import type { RCMD } from "@/types";

// Set revalidation period for ISR (60 seconds for more frequent updates)
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Params }) {
  // Await the params destructuring to ensure it's ready
  const { handle } = await Promise.resolve(params);

  return {
    title: `${handle}'s Recommendations | RCMD`,
    description: `Check out all the recommendations from ${handle} on RCMD. Food, drinks, products, and more.`,
  };
}

type Params = { handle: string };

export default async function ProfileRCMDsPage({ params }: { params: Params }) {
  // Await the params destructuring to ensure it's ready
  const { handle } = await Promise.resolve(params);

  console.log("Starting fetch for handle:", handle);

  try {
    // Create server-side supabase client
    const supabase = await createClient();

    // Fetch profile info first
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        `
        id, 
        handle, 
        first_name, 
        last_name, 
        bio, 
        location, 
        interests, 
        tags, 
        profile_picture_url, 
        cover_image
      `
      )
      .eq("handle", handle)
      .single();

    if (profileError || !profile) {
      return notFound();
    }

    console.log(`Found profile for ${handle}, profileId: ${profile.id}`);

    // Use our SQL function to fetch RCMDs
    console.log(
      "Calling SQL function get_public_rcmds_for_profile with profile_id:",
      profile.id
    );
    const { data: rcmds, error: rcmdsError } = await supabase.rpc(
      "get_public_rcmds_for_profile",
      {
        profile_id_param: profile.id,
      }
    );

    if (rcmdsError) {
      console.error("Error using SQL function:", rcmdsError);
    } else {
      console.log(`Found ${rcmds?.length || 0} RCMDs using SQL function`);
    }

    // Track view count
    try {
      await supabase.rpc("increment_profile_view", { profile_id: profile.id });
    } catch {
      // Silently continue if view tracking fails
    }

    // If we have zero RCMDs, show a friendly message
    if (!rcmds || rcmds.length === 0) {
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
                    {profile.interests.map(
                      (interest: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      )
                    )}
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
                      <div className="px-4 py-2 rounded-full text-sm font-medium transition-colors bg-white dark:bg-gray-700 shadow-sm">
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

              <div className="mt-8 w-full">
                <div className="p-8 text-center border rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold mb-2">No RCMDs yet</h2>
                  <p className="text-muted-foreground">
                    {profile.first_name} hasn't shared any recommendations yet.
                    Check back later!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
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

            {/* Simple static navigation bar */}
            <div className="mt-8 mb-6">
              <nav className="flex justify-center">
                <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center gap-1 shadow-sm">
                  <Link href={`/${handle}/rcmds`}>
                    <div className="px-4 py-2 rounded-full text-sm font-medium transition-colors bg-white dark:bg-gray-700 shadow-sm">
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
                {/* Use PublicRCMDBlocks component directly with rcmds data */}
                <PublicRCMDBlocks rcmds={rcmds as RCMD[]} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in ProfileRCMDsPage:", error);
    return (
      <div className="w-full p-8 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p>
          We could not load this profile's recommendations. Please try again
          later.
        </p>
      </div>
    );
  }
}
