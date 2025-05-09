import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { ensureUserProfile } from "@/utils/profile-utils";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  if (code) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.exchangeCodeForSession(code);

    if (!user) {
      console.error("Error signing in");
      return NextResponse.redirect(origin);
    }

    // Ensure a profile exists for this user
    const profileId = await ensureUserProfile(user.id);
    if (!profileId) {
      console.error("Failed to create profile for user", user.id);
      // Still continue the flow - other mechanisms will retry profile creation
    }

    // After session exchange and profile creation, check onboarding status
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_onboarded")
      .eq("auth_user_id", user.id)
      .single();

    // Redirect based on onboarding status
    if (!profile?.is_onboarded) {
      return NextResponse.redirect(`${origin}/protected/onboarding`);
    }
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // Only redirect to profile if we couldn't determine onboarding status
  // or if user is already onboarded
  return NextResponse.redirect(`${origin}/protected/profile/rcmds`);
}
