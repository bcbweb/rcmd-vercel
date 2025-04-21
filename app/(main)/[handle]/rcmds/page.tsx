import { createClient } from "@/utils/supabase/server";
import type { Metadata } from "next";
import type { RCMD } from "@/types";
import Image from "next/image";
import PublicRCMDBlocks from "@/components/features/rcmd/public-rcmd-blocks";

// Set revalidation period (reduced to 60 seconds for more frequent updates)
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { handle: string };
}): Promise<Metadata> {
  return {
    title: `${params.handle}'s Recommendations | RCMD`,
    description: `Check out all the recommendations from ${params.handle} on RCMD. Food, drinks, products, and more.`,
  };
}

type Params = { handle: string };

export default async function ProfileRCMDsPage({ params }: { params: Params }) {
  const supabase = await createClient();

  console.log("Fetching data for handle:", params.handle);

  // Get profile by handle
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", params.handle)
    .single();

  if (profileError) {
    console.error(
      "Error fetching profile:",
      profileError.message,
      profileError.code,
      profileError.details
    );
    return <div className="container">Profile not found</div>;
  }

  if (!profile) {
    console.error("No profile found for handle:", params.handle);
    return <div className="container">Profile not found</div>;
  }

  console.log(
    "Found profile with ID:",
    profile.id,
    "Name:",
    profile.first_name,
    profile.last_name
  );

  // Debug: Check if the SQL function exists
  const { data: functionExists, error: functionError } = await supabase.rpc(
    "does_function_exist",
    { function_name: "get_public_rcmds_for_profile" }
  );

  console.log(
    "SQL function exists check:",
    functionExists ? "✅ Function exists" : "❌ Function missing",
    functionError?.message || ""
  );

  // Debug: Direct query to check for any RCMDs with this profile_id (will fail if RLS blocks)
  const { data: directRcmds, error: directError } = await supabase
    .from("rcmds")
    .select("id, title, visibility")
    .eq("profile_id", profile.id)
    .limit(5);

  console.log(
    "Direct profile_id query results:",
    directRcmds?.length || 0,
    "Error:",
    directError ? `❌ ${directError.message} (${directError.code})` : "None"
  );

  // Debug: Direct query to check for any RCMDs with this owner_id (legacy - will fail if RLS blocks)
  const { data: legacyRcmds, error: legacyError } = await supabase
    .from("rcmds")
    .select("id, title, visibility")
    .eq("owner_id", profile.id)
    .limit(5);

  console.log(
    "Legacy owner_id query results:",
    legacyRcmds?.length || 0,
    "Error:",
    legacyError ? `❌ ${legacyError.message} (${legacyError.code})` : "None"
  );

  // Use our custom SQL function to fetch RCMDs bypassing RLS
  console.log(
    "Calling SQL function get_public_rcmds_for_profile with profile_id:",
    profile.id
  );
  const { data: rcmdsFromFunction, error: functionRcmdsError } =
    await supabase.rpc("get_public_rcmds_for_profile", {
      profile_id_param: profile.id,
    });

  if (functionRcmdsError) {
    console.error(
      "Error using SQL function:",
      functionRcmdsError.message,
      functionRcmdsError.code,
      functionRcmdsError.details
    );
  } else {
    console.log("SQL function call successful!");
  }

  const rcmds = rcmdsFromFunction || [];
  console.log(`Found ${rcmds.length} RCMDs for profile`);
  if (rcmds.length > 0) {
    console.log(
      "First few RCMDs:",
      rcmds.slice(0, 3).map((r: RCMD) => ({
        id: r.id,
        title: r.title,
        visibility: r.visibility,
        owner_id: r.owner_id,
        profile_id: r.profile_id,
      }))
    );
  }

  // Track view count
  try {
    await supabase.rpc("increment_profile_views", { profile_id: profile.id });
    console.log("Incremented profile view count");
  } catch (error) {
    console.error("Failed to increment view count:", error);
  }

  // If we have zero RCMDs, show a friendly message instead of a 404
  if (rcmds.length === 0) {
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
              <div className="p-8 text-center border rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-2">
                  No recommendations yet
                </h2>
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

          <div className="mt-8 w-full">
            <PublicRCMDBlocks rcmds={rcmds} />
          </div>
        </div>
      </div>
    </div>
  );
}
