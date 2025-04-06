import { NextRequest, NextResponse } from "next/server";
import { SocialPlatform } from "@/utils/social-auth";
import { createClient } from "@/utils/supabase/server";

// Define a type for the user profile returned by social platforms
interface SocialUserProfile {
  username: string;
  profileUrl?: string;
  id?: string;
  name?: string;
  imageUrl?: string;
}

// Update the interface for OAuth credentials to include the Instagram-specific fields
interface OAuthCredential {
  clientId: string | undefined;
  clientSecret: string | undefined;
  tokenUrl: string;
  userProfileUrl: string;
  // Optional fields for Instagram
  instagramProfileUrl?: string;
}

// Type for OAuth provider credentials - update to include facebook
type OAuthCredentials = {
  [key in SocialPlatform | "facebook"]: OAuthCredential;
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

// Using native URL constructor
function generateRedirectUrl(
  platform: string,
  status: string,
  message?: string
) {
  const baseUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/protected/onboarding/social-media`;
  const url = new URL(baseUrl);

  if (status === "success") {
    url.searchParams.set("success", `connected_${platform}`);
  } else {
    url.searchParams.set("error", `oauth_${platform}_${status}`);
    if (message) {
      url.searchParams.set("message", message);
    }
  }

  return url.toString();
}

// Exchange authorization code for access token
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

// Fetch user profile information from the platform
async function fetchUserProfile(
  platform: SocialPlatform,
  accessToken: string
): Promise<SocialUserProfile | null> {
  // In a production application, you would use the accessToken to make
  // platform-specific API calls to get real user data
  console.log(`Using access token: ${accessToken} for platform: ${platform}`);

  if (platform === "instagram") {
    return {
      username: "instagram_user",
      profileUrl: "https://instagram.com/instagram_user",
    };
  } else if (platform === "twitter") {
    return {
      username: "twitter_user",
      profileUrl: "https://twitter.com/twitter_user",
    };
  } else if (platform === "youtube") {
    return {
      username: "youtube_user",
      profileUrl: "https://youtube.com/user/youtube_user",
    };
  } else if (platform === "tiktok") {
    return {
      username: "tiktok_user",
      profileUrl: "https://tiktok.com/@tiktok_user",
    };
  } else if (platform === "linkedin") {
    return {
      username: "linkedin_user",
      profileUrl: "https://linkedin.com/in/linkedin_user",
    };
  } else if (platform === "facebook") {
    return {
      username: "facebook_user",
      profileUrl: "https://facebook.com/facebook_user",
    };
  } else {
    return null;
  }
}

// Using the correct Next.js App Router export format
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Extract the platform from the URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const platform = pathParts[pathParts.length - 1] as SocialPlatform;

  // Parse URL and search params
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  // Handle errors from OAuth provider
  if (error) {
    console.error(`Error during ${platform} OAuth: ${error}`);
    return NextResponse.redirect(generateRedirectUrl(platform, "failed"));
  }

  // Check if we have a code
  if (!code) {
    console.error(`No code provided in ${platform} OAuth callback`);
    return NextResponse.redirect(generateRedirectUrl(platform, "no_code"));
  }

  // Get credentials for the requested platform
  const credentials = OAUTH_CREDENTIALS[platform];
  if (!credentials) {
    console.error(`No credentials found for platform: ${platform}`);
    return NextResponse.redirect(generateRedirectUrl(platform, "config_error"));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetchAccessToken(platform, code);
    if (!tokenResponse.access_token) {
      throw new Error("Failed to get access token");
    }

    // Fetch user profile
    const userProfile = await fetchUserProfile(
      platform,
      tokenResponse.access_token
    );
    if (!userProfile || !userProfile.username) {
      throw new Error("Failed to get user profile");
    }

    // Get Supabase client
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      throw new Error("No authenticated user found");
    }

    // Get user's profile
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
      profile_url: userProfile.profileUrl || null,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token || null,
      token_expiry: tokenResponse.expires_in
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : null,
      scopes: tokenResponse.scope ? tokenResponse.scope.split(" ") : null,
      updated_at: new Date().toISOString(),
    };

    // Store in database
    const { error: integrationError } = await supabase
      .from("profile_social_integrations")
      .upsert(integrationData);

    if (integrationError) {
      throw new Error(
        `Failed to store integration: ${integrationError.message}`
      );
    }

    // Update social links table
    await supabase.from("profile_social_links").upsert({
      profile_id: profile.id,
      platform,
      handle: userProfile.username,
      updated_at: new Date().toISOString(),
    });

    // Redirect with success
    return NextResponse.redirect(generateRedirectUrl(platform, "success"));
  } catch (error: unknown) {
    console.error(`Error in ${platform} OAuth callback:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.redirect(
      generateRedirectUrl(platform, "failed", errorMessage)
    );
  }
}
