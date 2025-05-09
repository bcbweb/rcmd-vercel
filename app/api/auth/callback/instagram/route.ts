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

    // Step 2: Fetch user's Facebook profile first
    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`
    );

    if (!userResponse.ok) {
      throw new Error(`Error fetching user profile: ${userResponse.status}`);
    }

    const userData = await userResponse.json();

    // Step 3: Try to fetch Instagram account via the Pages API
    let instagramUsername = userData.name; // Default to Facebook name
    let instagramProfileUrl = `https://facebook.com/${userData.id}`; // Default to Facebook profile
    let instagramAccount = null;

    try {
      // Get Facebook Pages connected to the user
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account{username,profile_picture_url,name,id}&access_token=${accessToken}`
      );

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();

        // Look for Instagram business account in the pages data
        if (pagesData.data && pagesData.data.length > 0) {
          for (const page of pagesData.data) {
            if (page.instagram_business_account) {
              instagramAccount = page.instagram_business_account;
              instagramUsername = instagramAccount.username;
              instagramProfileUrl = `https://instagram.com/${instagramAccount.username}`;
              break;
            }
          }
        }
      }
    } catch (instagramError) {
      console.warn(
        "Could not fetch Instagram business account:",
        instagramError
      );
      // Continue with Facebook data
    }

    // Step 4: Store the connection in the database
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
        username: instagramUsername,
        profile_url: instagramProfileUrl,
        access_token: accessToken,
        token_expiry: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
        scopes: "public_profile,instagram_basic,pages_show_list",
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
      handle: instagramUsername,
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
