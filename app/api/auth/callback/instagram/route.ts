import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Instagram-specific callback handler
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const redirectUrl = "/protected/onboarding/social-media";

  // Get base URL with fallback to request origin
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    request.headers.get("origin") ||
    "http://localhost:3000";

  // Handle errors
  if (error) {
    console.error(`Error during Instagram OAuth: ${error}`);
    return NextResponse.redirect(
      `${baseUrl}${redirectUrl}?error=oauth_instagram_failed`
    );
  }

  if (!code) {
    console.error("No code provided in Instagram OAuth callback");
    return NextResponse.redirect(
      `${baseUrl}${redirectUrl}?error=oauth_instagram_no_code`
    );
  }

  try {
    // Step 1: Exchange code for access token using Facebook API
    const tokenUrl = "https://graph.facebook.com/v18.0/oauth/access_token";
    const callbackUrl = `${baseUrl}/api/auth/callback/instagram`;

    console.log(`[DEBUG] Using callback URL: ${callbackUrl}`);

    const tokenResponse = await fetch(
      `${tokenUrl}?client_id=${process.env.FACEBOOK_CLIENT_ID}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&code=${code}&redirect_uri=${callbackUrl}`,
      { method: "GET" }
    );

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      throw new Error(
        `Failed to fetch access token: ${tokenResponse.status} ${text}`
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Fetch user's Facebook profile
    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${accessToken}`
    );

    if (!userResponse.ok) {
      throw new Error(`Error fetching user profile: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    console.log("[DEBUG] User data:", JSON.stringify(userData));

    // Use Facebook data for the integration
    const username = userData.name
      ? userData.name.replace(/\s+/g, ".").toLowerCase()
      : `fb_user_${userData.id}`;
    const profileUrl = `https://facebook.com/${userData.id}`;

    // Get Supabase client
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      throw new Error("No authenticated user found");
    }

    // Get the user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile?.id) {
      throw new Error("Profile not found");
    }

    // Store in profile_social_integrations table
    const { error: integrationError } = await supabase
      .from("profile_social_integrations")
      .upsert({
        profile_id: profile.id,
        platform: "instagram",
        username: username,
        profile_url: profileUrl,
        access_token: accessToken,
        token_expiry: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
        scopes: "public_profile,email",
        updated_at: new Date().toISOString(),
      });

    if (integrationError) {
      throw new Error(
        `Failed to store integration: ${integrationError.message}`
      );
    }

    // Update the social links table
    await supabase.from("profile_social_links").upsert({
      profile_id: profile.id,
      platform: "instagram",
      handle: username,
      updated_at: new Date().toISOString(),
    });

    // Redirect to the onboarding page with success
    return NextResponse.redirect(
      `${baseUrl}${redirectUrl}?success=connected_instagram`
    );
  } catch (error) {
    console.error("Error in Instagram OAuth callback:", error);

    return NextResponse.redirect(
      `${baseUrl}${redirectUrl}?error=oauth_instagram_failed&message=${encodeURIComponent(
        error instanceof Error ? error.message : String(error)
      )}`
    );
  }
}
