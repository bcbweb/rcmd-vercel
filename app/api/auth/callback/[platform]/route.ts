import { NextRequest, NextResponse } from "next/server";
import { SocialPlatform } from "@/utils/social-auth";
import { createClient } from "@/utils/supabase/server";
import punycode from "punycode";
import { ensureUserProfile } from "@/utils/profile-utils";

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
  message?: string,
  request?: NextRequest
) {
  // Get base URL with fallback to request origin or default
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (request?.headers.get("origin") ?? "http://localhost:3000");

  const url = new URL(`${baseUrl}/protected/onboarding/social-media`);

  // Handle potential IDNs in the URL
  try {
    if (url.hostname.includes("xn--")) {
      url.hostname = punycode.toUnicode(url.hostname);
    }
  } catch (e) {
    console.error("Error converting punycode:", e);
  }

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
async function fetchAccessToken(
  platform: SocialPlatform,
  code: string,
  request: NextRequest
) {
  const credentials = OAUTH_CREDENTIALS[platform];

  // Get base URL with fallback to request origin or default
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    request.headers.get("origin") ||
    "http://localhost:3000";

  const redirectUri = `${baseUrl}/api/auth/callback/${platform}`;

  console.log(`[DEBUG] Using redirect URI for token exchange: ${redirectUri}`);

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
  try {
    if (platform === "instagram") {
      // First, get the Facebook pages connected to the user account
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account{username,profile_picture_url,name,id}&access_token=${accessToken}`
      );

      const pagesData = await pagesResponse.json();
      console.log(
        "[DEBUG] Instagram Pages Response:",
        JSON.stringify(pagesData)
      );

      // Check if there's any Instagram business account connected
      if (
        pagesData.data &&
        pagesData.data.length > 0 &&
        pagesData.data[0].instagram_business_account
      ) {
        const instagramAccount = pagesData.data[0].instagram_business_account;

        return {
          id: instagramAccount.id,
          username: instagramAccount.username,
          name: instagramAccount.name,
          profileUrl: `https://instagram.com/${instagramAccount.username}`,
          imageUrl: instagramAccount.profile_picture_url,
        };
      } else {
        // If no Instagram business account is found, try to fetch long-lived access token anyway
        // Get app-scoped user ID
        const meResponse = await fetch(
          `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
        );
        const meData = await meResponse.json();

        return {
          id: meData.id,
          username: `unknown_instagram_${meData.id}`,
          name: meData.name,
          profileUrl: `https://instagram.com/`,
        };
      }
    } else if (platform === "facebook") {
      // Get Facebook user profile
      const profileResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${accessToken}`
      );

      const profileData = await profileResponse.json();
      console.log(
        "[DEBUG] Facebook Profile Response:",
        JSON.stringify(profileData)
      );

      // Get Facebook pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
      );

      const pagesData = await pagesResponse.json();
      console.log(
        "[DEBUG] Facebook Pages Response:",
        JSON.stringify(pagesData)
      );

      let username = `user_${profileData.id}`;
      // Check if we have a custom username on any page
      if (pagesData.data && pagesData.data.length > 0) {
        // Use the first page's name as username if available
        username = pagesData.data[0].name.replace(/\s+/g, "").toLowerCase();
      }

      return {
        id: profileData.id,
        username: username,
        name: profileData.name,
        profileUrl: `https://facebook.com/${profileData.id}`,
        imageUrl: profileData.picture?.data?.url,
      };
    } else if (platform === "twitter") {
      // Existing Twitter code
      return {
        username: "twitter_user",
        profileUrl: "https://twitter.com/twitter_user",
      };
    } else if (platform === "youtube") {
      // Existing YouTube code
      return {
        username: "youtube_user",
        profileUrl: "https://youtube.com/user/youtube_user",
      };
    } else if (platform === "tiktok") {
      // Existing TikTok code
      return {
        username: "tiktok_user",
        profileUrl: "https://tiktok.com/@tiktok_user",
      };
    } else if (platform === "linkedin") {
      // Existing LinkedIn code
      return {
        username: "linkedin_user",
        profileUrl: "https://linkedin.com/in/linkedin_user",
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching ${platform} user profile:`, error);
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
    return NextResponse.redirect(
      generateRedirectUrl(platform, "failed", undefined, request)
    );
  }

  // Check if we have a code
  if (!code) {
    console.error(`No code provided in ${platform} OAuth callback`);
    return NextResponse.redirect(
      generateRedirectUrl(platform, "no_code", undefined, request)
    );
  }

  // Get credentials for the requested platform
  const credentials = OAUTH_CREDENTIALS[platform];
  if (!credentials) {
    console.error(`No credentials found for platform: ${platform}`);
    return NextResponse.redirect(
      generateRedirectUrl(platform, "config_error", undefined, request)
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetchAccessToken(platform, code, request);
    console.log(
      `[DEBUG] ${platform} Token Response:`,
      JSON.stringify(tokenResponse)
    );

    if (!tokenResponse.access_token) {
      throw new Error("Failed to get access token");
    }

    // For Instagram and Facebook, try to get a long-lived token
    let accessToken = tokenResponse.access_token;
    let expiresIn = tokenResponse.expires_in || 3600; // Default to 1 hour

    if (platform === "instagram" || platform === "facebook") {
      try {
        // Exchange for long-lived token
        const longLivedTokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${credentials.clientId}&client_secret=${credentials.clientSecret}&fb_exchange_token=${accessToken}`;

        const longLivedResponse = await fetch(longLivedTokenUrl);
        const longLivedData = await longLivedResponse.json();

        if (longLivedData.access_token) {
          console.log(`[DEBUG] Got long-lived token for ${platform}`);
          accessToken = longLivedData.access_token;
          expiresIn = longLivedData.expires_in || 5184000; // Default to 60 days
        }
      } catch (error) {
        console.error(`Error getting long-lived token for ${platform}:`, error);
        // Continue with short-lived token
      }
    }

    // Fetch user profile
    const userProfile = await fetchUserProfile(platform, accessToken);
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
      console.error("User not authenticated", userError);
      return NextResponse.redirect(
        generateRedirectUrl(
          platform,
          "auth_error",
          "User not authenticated",
          request
        )
      );
    }

    // Ensure a profile exists for this user
    const profileId = await ensureUserProfile(user.id);
    if (!profileId) {
      console.error("Failed to create profile for user:", user.id);
      return NextResponse.redirect(
        generateRedirectUrl(
          platform,
          "profile_error",
          "Failed to create profile",
          request
        )
      );
    }

    // Get the profile ID - this should now find the profile we just ensured exists
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profileData?.id || profileError) {
      console.error("Profile not found after creation attempt:", profileError);
      return NextResponse.redirect(
        generateRedirectUrl(
          platform,
          "profile_error",
          "Profile not found",
          request
        )
      );
    }

    // Calculate token expiry
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expiresIn);

    // Store the social integration
    const { error: integrationError } = await supabase
      .from("profile_social_integrations")
      .upsert({
        profile_id: profileData.id,
        platform: platform,
        username: userProfile.username,
        profile_url:
          userProfile.profileUrl ||
          `https://${platform}.com/${userProfile.username}`,
        access_token: accessToken,
        token_expiry: tokenExpiry.toISOString(),
        user_id: userProfile.id, // Store the platform-specific user ID
        name: userProfile.name, // Store the user's name if available
        image_url: userProfile.imageUrl, // Store profile image if available
        updated_at: new Date().toISOString(),
      });

    if (integrationError) {
      console.error("Error storing integration", integrationError);
      return NextResponse.redirect(
        generateRedirectUrl(
          platform,
          "db_error",
          "Failed to store integration",
          request
        )
      );
    }

    // Update profile_social_links as well
    await supabase.from("profile_social_links").upsert({
      profile_id: profileData.id,
      platform: platform,
      handle: userProfile.username,
      updated_at: new Date().toISOString(),
    });

    // Redirect back to the app with success
    return NextResponse.redirect(
      generateRedirectUrl(platform, "success", undefined, request)
    );
  } catch (error: unknown) {
    console.error(`Error processing ${platform} OAuth callback:`, error);
    return NextResponse.redirect(
      generateRedirectUrl(
        platform,
        "error",
        error instanceof Error ? error.message : "Unknown error occurred",
        request
      )
    );
  }
}
