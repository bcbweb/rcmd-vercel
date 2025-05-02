export const dynamic = "force-dynamic";
export const dynamicParams = true;

import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import PublicRCMDBlocks from "@/components/features/rcmd/public-rcmd-blocks";

// Set revalidation period for ISR (60 seconds for more frequent updates)
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Params }) {
  // Await the params destructuring to ensure it's ready
  const resolvedParams = await Promise.resolve(params);
  const { handle } = resolvedParams;

  return {
    title: `${handle}'s Recommendations | RCMD`,
    description: `Check out all the recommendations from ${handle} on RCMD. Food, drinks, products, and more.`,
  };
}

type Params = { handle: string };

export default async function ProfileRCMDsPage({ params }: { params: Params }) {
  // Await the params destructuring to ensure it's ready
  const resolvedParams = await Promise.resolve(params);
  const { handle } = resolvedParams;

  console.log("Starting fetch for handle:", handle);

  try {
    // Create server-side supabase client
    const supabase = await createClient();

    // Fetch profile info first
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
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
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">No RCMDs yet</h2>
          <p className="text-gray-600 dark:text-gray-400">
            This user hasn't shared any recommendations yet.
          </p>
        </div>
      );
    }

    // Return the RCMDs grid
    return (
      <div className="w-full">
        <PublicRCMDBlocks rcmds={rcmds} />
      </div>
    );
  } catch (error) {
    console.error("Error in ProfileRCMDsPage:", error);
    throw error;
  }
}
