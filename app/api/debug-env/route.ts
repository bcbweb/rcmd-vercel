import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Only available in development for security
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        error: "This endpoint is only available in development mode",
      },
      { status: 403 }
    );
  }

  // Return environment info to help debug
  return NextResponse.json({
    base_url: process.env.NEXT_PUBLIC_BASE_URL || null,
    request_origin: request.headers.get("origin") || null,
    request_host: request.headers.get("host") || null,
    tiktok_client_id: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_ID
      ? "[CONFIGURED]"
      : "[MISSING]",
    tiktok_client_secret: process.env.TIKTOK_CLIENT_SECRET
      ? "[CONFIGURED]"
      : "[MISSING]",
    node_env: process.env.NODE_ENV,
  });
}
