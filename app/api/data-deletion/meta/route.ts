import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/utils/supabase/server";
import { v4 as uuidv4 } from "uuid";

// Constants and environment variables
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const VERCEL_ENV = process.env.VERCEL_ENV || "development";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://rcmd.app";

// Types
interface MetaDeleteRequestPayload {
  user_id: string;
  algorithm: string;
  issued_at: number;
}

/**
 * Handle data deletion requests from Meta (Facebook/Instagram)
 * This endpoint is called when users delete their account or remove your app
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check app secret is configured
    if (!FACEBOOK_APP_SECRET) {
      console.error("[Meta Delete Handler] Facebook app secret not configured");
      return NextResponse.json(
        { error: "Internal configuration error" },
        { status: 500 }
      );
    }

    // Parse the request body
    const body = await request.json();

    // Log request in development/test environments
    if (VERCEL_ENV !== "production") {
      console.log(
        "[Meta Delete Handler] Received request:",
        JSON.stringify(body)
      );
    }

    // Check for confirmation_code request (Meta's way of testing if your endpoint works)
    if (body.test === true) {
      console.log("[Meta Delete Handler] Received test request");
      const confirmationCode = generateConfirmationCode();
      return NextResponse.json({
        url: `${BASE_URL}/account/deletion-status?code=${confirmationCode}`,
        confirmation_code: confirmationCode,
      });
    }

    // Validate that there's a signed_request
    const signedRequest = body.signed_request;
    if (!signedRequest) {
      console.error("[Meta Delete Handler] Missing signed_request");
      return NextResponse.json(
        { error: "Missing signed_request parameter" },
        { status: 400 }
      );
    }

    // Parse and verify the signed request
    try {
      const payload = parseSignedRequest(signedRequest, FACEBOOK_APP_SECRET);

      // Process user deletion and get the confirmation code
      const confirmationCode = await processUserDeletion(payload.user_id);

      // Log the successful deletion request
      console.log(
        `[Meta Delete Handler] Successfully processed deletion request for user ${payload.user_id}`
      );

      // Return both URL and confirmation code as required by Meta
      return NextResponse.json({
        url: `${BASE_URL}/account/deletion-status?code=${confirmationCode}`,
        confirmation_code: confirmationCode,
      });
    } catch (error) {
      console.error("[Meta Delete Handler] Invalid signed request:", error);
      return NextResponse.json(
        { error: "Invalid signed request" },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("[Meta Delete Handler] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Parse and verify a signed request from Meta
 */
function parseSignedRequest(
  signedRequest: string,
  appSecret: string
): MetaDeleteRequestPayload {
  // Split the signed request into signature and payload
  const parts = signedRequest.split(".", 2);
  if (parts.length !== 2) {
    throw new Error("Invalid signed request format");
  }

  const [encodedSig, encodedPayload] = parts;

  // Decode the signature
  const sig = Buffer.from(encodedSig, "base64").toString("hex");

  // Decode the payload
  const data = JSON.parse(
    Buffer.from(encodedPayload, "base64").toString("utf-8")
  );

  // Check algorithm
  if (data.algorithm !== "HMAC-SHA256") {
    throw new Error(`Unknown algorithm: ${data.algorithm}`);
  }

  // Calculate expected signature
  const expectedSig = crypto
    .createHmac("sha256", appSecret)
    .update(encodedPayload)
    .digest("hex");

  // Verify signature
  if (sig !== expectedSig) {
    throw new Error("Invalid signature");
  }

  return data;
}

/**
 * Generate a random confirmation code for Meta
 */
function generateConfirmationCode(): string {
  return uuidv4();
}

/**
 * Process the actual user data deletion
 */
async function processUserDeletion(metaUserId: string): Promise<string> {
  try {
    // Create Supabase client
    const supabase = await createClient();

    // Generate a confirmation code
    const confirmationCode = generateConfirmationCode();

    // Step 1: Log the deletion request for audit purposes
    await supabase.from("meta_deletion_logs").insert({
      provider: "facebook",
      provider_user_id: metaUserId,
      requested_at: new Date().toISOString(),
      status: "processing",
      confirmation_code: confirmationCode,
    });

    // Step 2: Find the user in your system that corresponds to this Meta user ID
    const { data: identityData } = await supabase
      .from("auth_identities")
      .select("user_id")
      .eq("provider", "facebook")
      .eq("provider_id", metaUserId)
      .single();

    // If no user found, just log it and return (nothing to delete)
    if (!identityData) {
      await supabase
        .from("meta_deletion_logs")
        .update({ status: "no_user_found" })
        .eq("provider", "facebook")
        .eq("provider_user_id", metaUserId)
        .eq("confirmation_code", confirmationCode);
      return confirmationCode;
    }

    const userId = identityData.user_id;

    // Step 3: Get profile ID for this user
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", userId)
      .single();

    if (!profileData) {
      await supabase
        .from("meta_deletion_logs")
        .update({ status: "no_profile_found" })
        .eq("provider", "facebook")
        .eq("provider_user_id", metaUserId)
        .eq("confirmation_code", confirmationCode);
      return confirmationCode;
    }

    const profileId = profileData.id;

    // Step 4: Delete user data in a transaction
    // For Supabase, we'll do multiple deletes since transactions are complex

    // Delete social integrations
    await supabase
      .from("profile_social_integrations")
      .delete()
      .eq("profile_id", profileId);

    // Delete recommendations
    await supabase.from("rcmds").delete().eq("profile_id", profileId);

    // Delete collections
    await supabase.from("collections").delete().eq("profile_id", profileId);

    // Delete profile
    await supabase.from("profiles").delete().eq("id", profileId);

    // Step 5: Update deletion log
    await supabase
      .from("meta_deletion_logs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("provider", "facebook")
      .eq("provider_user_id", metaUserId)
      .eq("confirmation_code", confirmationCode);

    return confirmationCode;
  } catch (error) {
    console.error("[Meta Delete Handler] Error processing deletion:", error);

    // Generate a confirmation code if we couldn't earlier
    const confirmationCode = generateConfirmationCode();

    // Log the error in the deletion logs
    const supabase = await createClient();
    await supabase
      .from("meta_deletion_logs")
      .update({
        status: "error",
        error_details: JSON.stringify(error),
      })
      .eq("provider", "facebook")
      .eq("provider_user_id", metaUserId)
      .eq("confirmation_code", confirmationCode);

    // Rethrow to handle in the main request handler
    throw error;
  }
}

// Define allowed HTTP methods
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
