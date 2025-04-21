import { createClient } from "@/utils/supabase/server";
import type { Metadata } from "next";
import type { RCMD } from "@/types";
import RCMDBlocks from "@/components/features/rcmd/rcmd-blocks";

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
      <div className="container pt-8">
        <div className="pb-6 pt-2">
          <div className="flex justify-between items-center">
            <h1 className="font-bold text-xl md:text-3xl">
              {profile.first_name} {profile.last_name}'s Recommendations
            </h1>
          </div>
        </div>
        <div className="p-8 text-center border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-2">No recommendations yet</h2>
          <p className="text-muted-foreground">
            {profile.first_name} hasn't shared any recommendations yet. Check
            back later!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container pt-8">
      <div className="pb-6 pt-2">
        <div className="flex justify-between items-center">
          <h1 className="font-bold text-xl md:text-3xl">
            {profile.first_name} {profile.last_name}'s Recommendations
          </h1>
        </div>
      </div>
      <RCMDBlocks rcmds={rcmds} isPublic={true} />
    </div>
  );
}
