/**
 * TikTok OAuth callback handler
 * NOTE: We've switched to using manual username input instead of OAuth for TikTok integration
 * This file is kept for reference or future use if we need to switch back to OAuth
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import punycode from "punycode";

// Define a type for the TikTok response
interface TikTokTokenResponse {
  data: {
    access_token: string;
    expires_in: number;
    open_id: string;
    scope: string;
    token_type: string;
  };
  message: string;
}

interface TikTokUserInfoResponse {
  data: {
    user: {
      open_id: string;
      union_id: string;
      avatar_url: string;
      avatar_url_100: string;
      avatar_url_200: string;
      display_name: string;
      profile_deep_link: string;
    };
  };
  message: string;
}

function generateRedirectUrl(status: string, message?: string) {
  const baseUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/protected/onboarding/social-media`;
  const url = new URL(baseUrl);

  // Handle potential IDNs in the URL
  try {
    if (url.hostname.includes("xn--")) {
      url.hostname = punycode.toUnicode(url.hostname);
    }
  } catch (e) {
    console.error("Error converting punycode:", e);
  }

  if (status === "success") {
    url.searchParams.set("success", "connected_tiktok");
  } else {
    url.searchParams.set("error", `oauth_tiktok_${status}`);
    if (message) {
      url.searchParams.set("message", message);
    }
  }

  return url.toString();
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Parse URL and search params
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  // Handle errors from OAuth provider
  if (error) {
    console.error(`Error during TikTok OAuth: ${error}`);
    return NextResponse.redirect(generateRedirectUrl("failed"));
  }

  // Check if we have a code
  if (!code) {
    console.error("No code provided in TikTok OAuth callback");
    return NextResponse.redirect(generateRedirectUrl("no_code"));
  }

  try {
    // Exchange code for access token
    const clientKey = process.env.TIKTOK_CLIENT_ID;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    if (!clientKey || !clientSecret) {
      throw new Error("Missing TikTok API credentials");
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://open-api.tiktok.com/oauth/access_token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000"}/api/auth/callback/tiktok`,
        }).toString(),
      }
    );

    const tokenData = (await tokenResponse.json()) as TikTokTokenResponse;

    if (!tokenData.data || !tokenData.data.access_token) {
      console.error("Failed to get access token from TikTok:", tokenData);
      return NextResponse.redirect(
        generateRedirectUrl("token_error", "Failed to get access token")
      );
    }

    // Fetch user profile using the access token
    const { access_token, open_id } = tokenData.data;

    const userInfoResponse = await fetch(
      `https://open-api.tiktok.com/oauth/userinfo/?open_id=${open_id}&access_token=${access_token}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const userInfo = (await userInfoResponse.json()) as TikTokUserInfoResponse;

    if (!userInfo.data || !userInfo.data.user) {
      console.error("Failed to get user info from TikTok:", userInfo);
      return NextResponse.redirect(
        generateRedirectUrl("profile_error", "Failed to get user profile")
      );
    }

    // Get user profile data
    const { display_name, profile_deep_link, avatar_url } = userInfo.data.user;

    // Get Supabase client
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      console.error("No authenticated user found:", userError);
      return NextResponse.redirect(
        generateRedirectUrl("auth_error", "User not authenticated")
      );
    }

    // Get the profile ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile?.id) {
      console.error("Profile not found for user:", user.id);
      return NextResponse.redirect(
        generateRedirectUrl("profile_error", "User profile not found")
      );
    }

    // Calculate token expiry
    const expiresIn = tokenData.data.expires_in;
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expiresIn);

    // Store the social media integration
    const { error: integrationError } = await supabase
      .from("profile_social_integrations")
      .upsert({
        profile_id: profile.id,
        platform: "tiktok",
        username: display_name,
        profile_url: profile_deep_link,
        access_token: access_token,
        token_expiry: tokenExpiry.toISOString(),
        scopes: ["user.info.profile"],
        metadata: {
          open_id: open_id,
          avatar_url: avatar_url,
        },
        updated_at: new Date().toISOString(),
      });

    if (integrationError) {
      console.error("Error storing TikTok integration:", integrationError);
      return NextResponse.redirect(
        generateRedirectUrl("db_error", "Failed to store integration")
      );
    }

    // Update the profile social links
    await supabase.from("profile_social_links").upsert({
      profile_id: profile.id,
      platform: "tiktok",
      handle: display_name,
      updated_at: new Date().toISOString(),
    });

    // Redirect back to the onboarding page with success message
    return NextResponse.redirect(generateRedirectUrl("success"));
  } catch (error) {
    console.error("Error handling TikTok OAuth callback:", error);
    return NextResponse.redirect(
      generateRedirectUrl("server_error", "Server error processing callback")
    );
  }
}
