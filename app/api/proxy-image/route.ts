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

// Helper function to generate a response for both handlers
async function proxyImage(imageUrl: string) {
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
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    // Fetch the image with proper headers to avoid CORS issues
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RCMD-bot/1.0)",
        Accept: "image/*",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `Proxy image fetch failed: ${response.status} ${response.statusText} for ${imageUrl}`
      );
      return NextResponse.json(
        {
          error: `Failed to fetch image: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    console.log(`Image content type: ${contentType} for ${imageUrl}`);

    // If content type is not a recognized image type, try to detect from URL or default to jpeg
    let effectiveContentType = contentType;
    if (!ALLOWED_MIME_TYPES.some((type) => contentType.startsWith(type))) {
      console.warn(
        `Unrecognized content type: ${contentType} for ${imageUrl}, trying to detect from URL`
      );

      // Try to detect from URL extension
      const urlLower = imageUrl.toLowerCase();
      if (urlLower.endsWith(".jpg") || urlLower.endsWith(".jpeg")) {
        effectiveContentType = "image/jpeg";
      } else if (urlLower.endsWith(".png")) {
        effectiveContentType = "image/png";
      } else if (urlLower.endsWith(".webp")) {
        effectiveContentType = "image/webp";
      } else if (urlLower.endsWith(".gif")) {
        effectiveContentType = "image/gif";
      } else {
        // Default to JPEG if we can't determine
        effectiveContentType = "image/jpeg";
      }
      console.log(
        `Using detected/default content type: ${effectiveContentType} for ${imageUrl}`
      );
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
      console.error(
        `Image too large: ${parseInt(contentLength, 10) / (1024 * 1024)}MB for ${imageUrl}`
      );
      return NextResponse.json(
        { error: "Image too large (max 5MB)" },
        { status: 413 }
      );
    }

    // Get the image as a blob
    const blob = await response.blob();
    console.log(
      `Downloaded image size: ${(blob.size / 1024).toFixed(2)}KB for ${imageUrl}`
    );

    // Check size after obtaining the blob as content-length may not always be accurate
    if (blob.size > MAX_FILE_SIZE) {
      console.error(
        `Image too large after download: ${blob.size / (1024 * 1024)}MB for ${imageUrl}`
      );
      return NextResponse.json(
        { error: "Image too large (max 5MB)" },
        { status: 413 }
      );
    }

    // If the blob is suspiciously small, it might not be a valid image
    if (blob.size < 100) {
      console.error(
        `Suspiciously small image size: ${blob.size} bytes for ${imageUrl}`
      );
      return NextResponse.json(
        { error: "Image data appears invalid (too small)" },
        { status: 415 }
      );
    }

    // Return the blob with the same content type
    return new NextResponse(blob, {
      headers: {
        "Content-Type": effectiveContentType,
        "Cache-Control": "public, max-age=31536000, immutable", // 1 year
      },
    });
  } catch (fetchError) {
    clearTimeout(timeoutId);
    console.error(
      `Proxy image fetch error: ${fetchError instanceof Error ? fetchError.message : "Unknown"} for ${imageUrl}`
    );

    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 408 });
    }

    // Return a proper error response instead of throwing
    return NextResponse.json(
      {
        error: `Failed to fetch image: ${
          fetchError instanceof Error ? fetchError.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;
    return await proxyImage(imageUrl);
  } catch (error) {
    console.error("Proxy image POST error:", error);
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

export async function GET(request: NextRequest) {
  try {
    // Extract URL from query parameters
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");
    return await proxyImage(imageUrl || "");
  } catch (error) {
    console.error("Proxy image GET error:", error);
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
