import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

interface Params {
  handle: string;
}

export default async function PublicProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  // Await the params destructuring to ensure it's ready
  const resolvedParams = await Promise.resolve(params);
  const { handle } = resolvedParams;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select()
    .eq("handle", handle)
    .single();

  if (!profile) {
    notFound();
  }

  // Fetch profile pages
  const { data: profilePages } = await supabase
    .from("profile_pages")
    .select("id, name, slug")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen">
      {/* Cover Image */}
      <div className="w-full h-48 md:h-64 relative bg-gray-200 dark:bg-gray-700">
        {profile.cover_image && (
          <Image
            src={profile.cover_image}
            alt="Cover"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
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

          {/* Navigation bar with default tabs and profile pages */}
          <div className="mt-8 mb-6">
            <nav className="flex justify-center">
              <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center gap-1 shadow-sm flex-wrap">
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
                {profilePages?.map((page) => (
                  <Link key={page.id} href={`/${handle}/${page.slug}`}>
                    <div className="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
                      {page.name}
                    </div>
                  </Link>
                ))}
              </div>
            </nav>
          </div>

          {/* Page content */}
          <div className="w-full">
            <div className="max-w-3xl mx-auto">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
