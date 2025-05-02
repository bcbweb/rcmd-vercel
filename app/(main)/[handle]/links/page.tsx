export const dynamic = "force-dynamic";
export const dynamicParams = true;

import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import PublicLinkBlocks from "@/components/features/links/public-link-blocks";

// Set revalidation period for ISR (60 seconds for more frequent updates)
export const revalidate = 60;

type Params = { handle: string };

export default async function ProfileLinksPage({ params }: { params: Params }) {
  // Await the params destructuring to ensure it's ready
  const { handle } = await Promise.resolve(params);

  console.log("Starting fetch for handle:", handle);

  // Create server-side supabase client
  const supabase = await createClient();

  // Fetch the profile data with default page information
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .single();

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

    // Use our custom SQL function to fetch links bypassing RLS
    console.log(
      "Calling SQL function get_public_links_for_profile with profile_id:",
      profile.id
    );
    const { data: links, error: linksError } = await supabase.rpc(
      "get_public_links_for_profile",
      {
        profile_id_param: profile.id,
      }
    );

    if (linksError) {
      console.error("Error using SQL function:", linksError);
    } else {
      console.log(`Found ${links?.length || 0} links using SQL function`);
    }

    // Track view count
    await supabase.rpc("increment_profile_view", { profile_id: profile.id });

    // If we have zero links, show a friendly message
    if (!links || links.length === 0) {
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">No Links yet</h2>
          <p className="text-gray-600 dark:text-gray-400">
            This user hasn't shared any links yet.
          </p>
        </div>
      );
    }

    // Return the Links grid
    return (
      <div className="w-full">
        <PublicLinkBlocks links={links} />
      </div>
    );
  } catch (error) {
    console.error("Error in ProfileLinksPage:", error);
    throw error;
  }
}
