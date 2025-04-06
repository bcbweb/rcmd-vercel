import { NextRequest, NextResponse } from "next/server";

// Maximum file size to allow (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    if (!imageUrl.startsWith("http")) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }

    console.log(`Proxying image request for: ${imageUrl}`);

    // Set a timeout for the fetch operation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      // Fetch the image with proper headers to avoid CORS issues
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RCMD-bot/1.0)",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch image: ${response.statusText}` },
          { status: response.status }
        );
      }

      const contentType = response.headers.get("content-type") || "";
      if (!ALLOWED_MIME_TYPES.some((type) => contentType.startsWith(type))) {
        return NextResponse.json(
          { error: "Invalid image type" },
          { status: 415 }
        );
      }

      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Image too large (max 5MB)" },
          { status: 413 }
        );
      }

      // Get the image as a blob
      const blob = await response.blob();

      // Check size after obtaining the blob as content-length may not always be accurate
      if (blob.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Image too large (max 5MB)" },
          { status: 413 }
        );
      }

      // Return the blob with the same content type
      return new NextResponse(blob, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable", // 1 year
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timed out" },
          { status: 408 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Proxy image error:", error);
    return NextResponse.json(
      {
        error: `Failed to proxy image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
