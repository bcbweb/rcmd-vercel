import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getMetadataBase } from "@/utils/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect("/sign-in");
  }

  // Get active profile ID from user_active_profiles
  let profileId: string | null = null;
  const { data: activeProfile } = await supabase
    .from("user_active_profiles")
    .select("profile_id")
    .eq("auth_user_id", user.id)
    .single();

  if (activeProfile) {
    profileId = activeProfile.profile_id;
  } else {
    // Fallback: get the first profile for the user
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);

    if (profiles && profiles.length > 0) {
      profileId = profiles[0].id;
    }
  }

  if (profileId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_onboarded")
      .eq("id", profileId)
      .single();

    if (profile?.is_onboarded) {
      redirect("/protected/profile/rcmds");
    }
  }

  return {
    metadataBase: getMetadataBase(),
    title: `Complete Your Profile`,
    description: "Set up your account",
  };
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4 py-8 min-w-96 max-w-96 min-h-96">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
