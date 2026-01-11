import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { ensureUserProfile } from "@/utils/profile-utils";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();
  const type = requestUrl.searchParams.get("type"); // Supabase includes 'signup' for email verification

  if (code) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.exchangeCodeForSession(code);

    if (!user) {
      console.error("Error signing in");
      return NextResponse.redirect(
        `${origin}/sign-in?error=${encodeURIComponent("Authentication failed. Please try again.")}`
      );
    }

    // Check if this is a new signup (email verification or OAuth first-time login)
    // Supabase includes type=signup in the callback URL for email verification links
    // For OAuth, check if user was just created (within 5 minutes)
    const isNewSignup =
      type === "signup" ||
      (user.email_confirmed_at &&
        user.created_at &&
        new Date(user.email_confirmed_at).getTime() -
          new Date(user.created_at).getTime() <
          5 * 60 * 1000); // Within 5 minutes of creation

    // OAuth users are automatically email-verified, so treat first-time OAuth as new signup
    const isOAuthUser =
      user.app_metadata?.provider && user.app_metadata.provider !== "email";
    const isFirstTimeOAuth =
      isOAuthUser &&
      user.created_at &&
      new Date().getTime() - new Date(user.created_at).getTime() <
        5 * 60 * 1000;

    const isEmailVerification = isNewSignup && !isOAuthUser;

    // Ensure a profile exists for this user
    const profileId = await ensureUserProfile(user.id);
    if (!profileId) {
      console.error("Failed to create profile for user", user.id);
      // Still continue the flow - other mechanisms will retry profile creation
    }

    // After session exchange and profile creation, check onboarding status
    // Get active profile ID from user_active_profiles
    let activeProfileId: string | null = null;
    const { data: activeProfile } = await supabase
      .from("user_active_profiles")
      .select("profile_id")
      .eq("auth_user_id", user.id)
      .single();

    if (activeProfile) {
      activeProfileId = activeProfile.profile_id;
    } else {
      // Fallback: get the first profile for the user
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);

      if (profiles && profiles.length > 0) {
        activeProfileId = profiles[0].id;
      }
    }

    // Check onboarding status of the active profile
    if (activeProfileId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_onboarded")
        .eq("id", activeProfileId)
        .single();

      // Redirect based on onboarding status
      if (!profile?.is_onboarded) {
        // If this is a new signup (email verification or first-time OAuth), add a success message
        // Redirect directly to social-media page (first onboarding step) to preserve query param
        const verificationParam =
          isEmailVerification || isFirstTimeOAuth
            ? `?verified=${encodeURIComponent("true")}`
            : "";
        return NextResponse.redirect(
          `${origin}/protected/onboarding/social-media${verificationParam}`
        );
      } else if (isEmailVerification || isFirstTimeOAuth) {
        // User is onboarded and just signed up - redirect to profile with success message
        return NextResponse.redirect(
          `${origin}/protected/profile/rcmds?verified=${encodeURIComponent("true")}`
        );
      }
    } else if (isEmailVerification || isFirstTimeOAuth) {
      // No profile found but user just signed up - redirect to onboarding
      return NextResponse.redirect(
        `${origin}/protected/onboarding/social-media?verified=${encodeURIComponent("true")}`
      );
    }
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // Only redirect to profile if we couldn't determine onboarding status
  // or if user is already onboarded
  return NextResponse.redirect(`${origin}/protected/profile/rcmds`);
}
