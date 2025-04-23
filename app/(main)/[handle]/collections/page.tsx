import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import CollectionBlocks from "@/components/features/profile/public/collection-blocks";

// Set revalidation period for ISR (60 seconds for more frequent updates)
export const revalidate = 60;

interface Params {
  handle: string;
}

export default async function ProfileCollectionsPage({
  params,
}: {
  params: Params;
}) {
  // Await the params destructuring to ensure it's ready
  if (!params.handle) {
    return notFound();
  }

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
    .eq("handle", params.handle)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching profile:", profileError);
    return notFound();
  }

  try {
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
              {/* Pass the profile ID to the client component */}
              <CollectionBlocks profileId={profile.id} />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in collections page:", error);
    return (
      <div className="text-center py-12 text-red-500">
        An error occurred loading this profile
      </div>
    );
  }
}
