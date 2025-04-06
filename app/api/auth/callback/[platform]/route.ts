import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { SocialPlatform } from "@/utils/social-auth";

// Update the interface for OAuth credentials to include the Instagram-specific fields
interface OAuthCredential {
  clientId: string | undefined;
  clientSecret: string | undefined;
  tokenUrl: string;
  userProfileUrl: string;
  // Optional fields for Instagram
  instagramProfileUrl?: string;
}

// Type for OAuth provider credentials
type OAuthCredentials = {
  [key in SocialPlatform]: OAuthCredential;
};

// Configuration for OAuth providers (server-side)
const OAUTH_CREDENTIALS: OAuthCredentials = {
  instagram: {
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    userProfileUrl: "https://graph.facebook.com/v18.0/me",
    instagramProfileUrl:
      "https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account{username,profile_picture_url,name,id}",
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    userProfileUrl: "https://api.twitter.com/2/users/me",
  },
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    tokenUrl: "https://oauth2.googleapis.com/token",
    userProfileUrl:
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
  },
  tiktok: {
    clientId: process.env.TIKTOK_CLIENT_ID,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    tokenUrl: "https://open-api.tiktok.com/oauth/access_token/",
    userProfileUrl: "https://open-api.tiktok.com/oauth/userinfo/",
  },
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    userProfileUrl: "https://api.linkedin.com/v2/me",
  },
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    tokenUrl: "https://graph.facebook.com/v12.0/oauth/access_token",
    userProfileUrl: "https://graph.facebook.com/me",
  },
};

/**
 * Handle OAuth callbacks for different social media platforms
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const platform = params.platform as SocialPlatform;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const redirectUrl = "/protected/onboarding/social-media";

  // Handle errors
  if (error) {
    console.error(`Error during ${platform} OAuth: ${error}`);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}${redirectUrl}?error=oauth_${platform}_failed`
    );
  }

  if (!code) {
    console.error(`No code provided in ${platform} OAuth callback`);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}${redirectUrl}?error=oauth_${platform}_no_code`
    );
  }

  // Get credentials for the requested platform
  const credentials = OAUTH_CREDENTIALS[platform];
  if (!credentials) {
    console.error(`No credentials found for platform: ${platform}`);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}${redirectUrl}?error=oauth_${platform}_config_error`
    );
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetchAccessToken(platform, code);
    if (!tokenResponse.access_token) {
      throw new Error("Failed to get access token");
    }

    // Fetch user profile information
    const userProfile = await fetchUserProfile(
      platform,
      tokenResponse.access_token
    );
    if (!userProfile) {
      throw new Error("Failed to get user profile");
    }

    // Store the integration in the database for the authenticated user
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

    // Prepare integration data
    const integrationData = {
      profile_id: profile.id,
      platform,
      username: userProfile.username,
      profile_url: userProfile.profileUrl,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token || null,
      token_expiry: tokenResponse.expires_in
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : null,
      scopes: tokenResponse.scope ? tokenResponse.scope.split(" ") : null,
      updated_at: new Date().toISOString(),
    };

    // Store in profile_social_integrations table
    const { error: integrationError } = await supabase
      .from("profile_social_integrations")
      .upsert(integrationData);

    if (integrationError) {
      throw new Error(
        `Failed to store integration: ${integrationError.message}`
      );
    }

    // Update the social links table
    await supabase.from("profile_social_links").upsert({
      profile_id: profile.id,
      platform,
      handle: userProfile.username,
      updated_at: new Date().toISOString(),
    });

    // Redirect to the onboarding page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}${redirectUrl}?success=connected_${platform}`
    );
  } catch (error) {
    console.error(`Error in ${platform} OAuth callback:`, error);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}${redirectUrl}?error=oauth_${platform}_failed&message=${encodeURIComponent(error.message)}`
    );
  }
}

/**
 * Exchange authorization code for access token
 */
async function fetchAccessToken(platform: SocialPlatform, code: string) {
  const credentials = OAUTH_CREDENTIALS[platform];
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/${platform}`;

  // Handle different platforms with appropriate request formats
  if (platform === "twitter") {
    // Twitter expects JSON
    const body = JSON.stringify({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: "challenge",
    });

    const response = await fetch(credentials.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    return await response.json();
  } else {
    // Most platforms expect form data
    const formData = new URLSearchParams({
      client_id: credentials.clientId || "",
      client_secret: credentials.clientSecret || "",
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    const response = await fetch(credentials.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    return await response.json();
  }
}

/**
 * Fetch user profile information from the platform
 */
async function fetchUserProfile(platform: SocialPlatform, accessToken: string) {
  const credentials = OAUTH_CREDENTIALS[platform];

  if (platform === "instagram") {
    // Instagram handling code...
  } else if (platform === "twitter") {
    // Twitter handling code...
  } else if (platform === "youtube") {
    // YouTube handling code...
  } else if (platform === "tiktok") {
    // TikTok handling code...
  } else if (platform === "linkedin") {
    // LinkedIn handling code...
  } else if (platform === "facebook") {
    // Facebook handling code...
  } else {
    // Default handling for any platform
    let profileUrl = credentials.userProfileUrl;
    let headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    // Platform-specific adjustments
    // ... existing code ...
  }
}
