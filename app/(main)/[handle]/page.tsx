import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";

// Set revalidation period (reduced to 60 seconds for more frequent updates)
export const revalidate = 60;

// Add this near the top of the file, before the component definition
export const dynamic = "force-dynamic";
export const dynamicParams = true;

// Pre-render popular profiles at build time
export async function generateStaticParams() {
  // For now, return an empty array since we want dynamic rendering
  // If you want to pre-render specific profiles, you can fetch them here
  return [];
}

type Params = { handle: string };

export default async function ProfilePage({ params }: { params: Params }) {
  // Await the params destructuring to ensure it's ready
  const { handle } = await Promise.resolve(params);
  const supabase = await createClient();

  // Verify the profile exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .single();

  if (!profile) {
    return notFound();
  }

  // Redirect to the rcmds page for this profile
  return redirect(`/${handle}/rcmds`);
}
