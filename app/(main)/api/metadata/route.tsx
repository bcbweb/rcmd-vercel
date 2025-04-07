import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import punycode from "punycode";

// Helper function to proxy image URLs
function proxyImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;

  // Ensure imageUrl is a proper URL string
  try {
    new URL(imageUrl); // This will throw an error if the URL is invalid
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return undefined; // Return undefined if the URL is invalid
  }

  // In development, return the original URL since we've configured Next.js to allow all domains
  if (process.env.NODE_ENV === "development") {
    return imageUrl;
  }

  // In production, return a proxied URL
  return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
}

// Helper to ensure URLs are absolute
function ensureAbsoluteUrl(
  url: string | undefined,
  base: string
): string | undefined {
  if (!url) return undefined;

  try {
    // Try to create a URL object - this will work for absolute URLs
    return new URL(url, base).toString();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return undefined;
  }
}

// Common metadata fetching function to be reused by both GET and POST handlers
async function fetchMetadata(url: string) {
  console.log(`[Metadata API] Fetching data for URL: ${url}`);

  if (!url) {
    console.log(`[Metadata API] Empty URL received`);
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Ensure URL starts with http:// or https://
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
    console.log(`[Metadata API] Normalized URL to: ${url}`);
  }

  let urlObj;
  try {
    // Handle URL parsing with punycode support
    urlObj = new URL(url);
    // Handle potential IDN in hostname
    if (urlObj.hostname.includes("xn--")) {
      urlObj.hostname = punycode.toUnicode(urlObj.hostname);
    }
    console.log(`[Metadata API] Parsed URL: ${urlObj.toString()}`);
  } catch (urlError: unknown) {
    console.error(`[Metadata API] Invalid URL format: ${urlError}`);
    return NextResponse.json(
      {
        error: `Invalid URL format: ${urlError instanceof Error ? urlError.message : "Unknown error"}`,
      },
      { status: 400 }
    );
  }

  // Add a timeout to the fetch request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // Increase timeout to 10 seconds

  try {
    console.log(`[Metadata API] Fetching content from: ${url}`);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RCMDBot/1.0; +https://rcmd.world)",
        Accept: "text/html,application/xhtml+xml,application/xml",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      redirect: "follow", // Follow redirects
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `[Metadata API] Fetch failed with status: ${response.status}`
      );
      return NextResponse.json(
        {
          error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
        },
        { status: 500 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    console.log(`[Metadata API] Content type: ${contentType}`);

    // Get complete domain for fallback values
    const fullDomain = urlObj.hostname;

    if (!contentType.includes("text/html")) {
      console.log(`[Metadata API] Not HTML content, returning basic metadata`);
      return NextResponse.json({
        title: fullDomain,
        description: `Content from ${fullDomain}`,
        type: contentType.split(";")[0],
        url: urlObj.toString(),
      });
    }

    const html = await response.text();
    console.log(`[Metadata API] HTML content length: ${html.length}`);

    if (!html || html.trim().length === 0) {
      console.error(`[Metadata API] Empty HTML content received`);
      return NextResponse.json({
        title: fullDomain,
        description: `Content from ${fullDomain}`,
        type: "website",
        url: urlObj.toString(),
      });
    }

    const $ = cheerio.load(html);

    console.log(`[Metadata API] Extracting metadata tags`);
    // Debug available meta tags
    $("meta").each((i, el) => {
      const name = $(el).attr("name") || $(el).attr("property");
      const content = $(el).attr("content");
      if (name && content) {
        console.log(
          `[Metadata API] Meta tag: ${name} = ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`
        );
      }
    });

    // Extract title with proper fallbacks
    const ogTitle = $('meta[property="og:title"]').attr("content");
    const twitterTitle = $('meta[name="twitter:title"]').attr("content");
    const htmlTitle = $("title").first().text().trim();

    // Use actual tags with preference order
    const title = ogTitle || twitterTitle || htmlTitle || fullDomain;

    console.log(`[Metadata API] Extracted title: "${title}"`);

    // Extract description with proper fallbacks
    const metaDescription = $('meta[name="description"]').attr("content");
    const ogDescription = $('meta[property="og:description"]').attr("content");
    const twitterDescription = $('meta[name="twitter:description"]').attr(
      "content"
    );

    let description = metaDescription || ogDescription || twitterDescription;

    // If no description meta tags, try to extract from content
    if (!description) {
      // Try to extract first paragraph if no description available
      const firstParagraph = $("p").first().text().trim();
      if (firstParagraph && firstParagraph.length > 10) {
        description = firstParagraph.substring(0, 200);
      } else {
        description = `Content from ${fullDomain}`;
      }
    }

    console.log(
      `[Metadata API] Extracted description: "${description?.substring(0, 30)}..."`
    );

    // Extract image with proper handling
    const ogImage = $('meta[property="og:image"]').attr("content");
    const twitterImage =
      $('meta[name="twitter:image"]').attr("content") ||
      $('meta[name="twitter:image:src"]').attr("content");

    const imageUrl = ensureAbsoluteUrl(ogImage || twitterImage, urlObj.origin);

    console.log(`[Metadata API] Extracted image URL: ${imageUrl || "none"}`);

    // Extract favicon with proper fallbacks and handling
    let faviconUrl;
    const iconLink =
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      $('link[rel="apple-touch-icon"]').attr("href");

    if (iconLink) {
      faviconUrl = ensureAbsoluteUrl(iconLink, urlObj.origin);
    } else {
      // Fallback to default favicon location
      faviconUrl = `${urlObj.origin}/favicon.ico`;
    }

    console.log(`[Metadata API] Favicon URL: ${faviconUrl}`);

    // Extract type with fallbacks
    const type = $('meta[property="og:type"]').attr("content") || "website";
    console.log(`[Metadata API] Content type: ${type}`);

    const metadata = {
      title,
      description,
      image: proxyImageUrl(imageUrl),
      favicon: proxyImageUrl(faviconUrl),
      type,
      url: urlObj.toString(), // Include the normalized URL
    };

    console.log(`[Metadata API] Returning metadata:`, metadata);
    return NextResponse.json(metadata);
  } catch (fetchError: unknown) {
    clearTimeout(timeoutId);
    console.error(`[Metadata API] Error during fetch:`, fetchError);

    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 408 });
    }

    // Get complete domain for fallback values
    const fullDomain = urlObj.hostname;

    // Fall back to basic response with just the domain
    const fallbackMetadata = {
      title: fullDomain,
      description: `Content from ${fullDomain}`,
      type: "website",
      url: urlObj.toString(), // Include the normalized URL
    };

    console.log(
      `[Metadata API] Returning fallback metadata:`,
      fallbackMetadata
    );
    return NextResponse.json(fallbackMetadata);
  }
}

// GET handler for the metadata API - to support LinkInput component's request
export async function GET(request: Request) {
  try {
    // Extract URL from query parameters
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Call the common metadata fetch function
    return fetchMetadata(url);
  } catch (error) {
    console.error("Metadata fetch error (GET):", error);
    return NextResponse.json(
      {
        error: `Failed to fetch metadata: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    return fetchMetadata(url);
  } catch (error) {
    console.error("Metadata fetch error:", error);
    return NextResponse.json(
      {
        error: `Failed to fetch metadata: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
