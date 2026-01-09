import { NextResponse } from "next/server";
import metascraper from "metascraper";
import metascraperTitle from "metascraper-title";
import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperLogo from "metascraper-logo";
import metascraperAuthor from "metascraper-author";
import metascraperPublisher from "metascraper-publisher";
import metascraperUrl from "metascraper-url";

/**
 * Metadata fetching API route
 *
 * Uses a multi-tier approach:
 * 1. Microlink API (free tier) - handles most sites, including some Cloudflare-protected
 * 2. Direct fetch + metascraper - fallback for sites Microlink can't handle
 * 3. URL-based fallback - creates metadata from domain name
 *
 * To upgrade to Microlink PRO for better Cloudflare bypass:
 * 1. Get your API key from https://microlink.io/dashboard
 * 2. Add to .env.local: MICROLINK_API_KEY=your_api_key_here
 * 3. The code will automatically use PRO features (proxy, enhanced antibot handling)
 *
 * See: https://microlink.io/blog/antibot-at-scale for more info on antibot handling
 */

async function fetchMetadata(url: string) {
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Ensure URL starts with http:// or https://
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  try {
    // Validate URL format
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    // First try with Microlink's API with timeout
    const microlinkController = new AbortController();
    const microlinkTimeout = setTimeout(() => {
      microlinkController.abort();
    }, 10000); // 10 second timeout for Microlink (increased)

    try {
      // Build Microlink URL with optimal parameters
      // See: https://microlink.io/docs/api/getting-started/overview
      const microlinkParams = new URLSearchParams({
        url: url,
        palette: "true",
        audio: "true",
        video: "true",
        iframe: "true",
        // Add proxy parameter if API key is available (PRO plan feature)
        // PRO plan enables automatic proxy resolution for antibot bypass
        // See: https://microlink.io/blog/antibot-at-scale
        ...(process.env.MICROLINK_API_KEY && {
          proxy: "true", // Enable proxy for enhanced antibot bypass (PRO feature)
        }),
      });

      const microlinkUrl = `https://api.microlink.io/?${microlinkParams.toString()}`;
      const hasApiKey = !!process.env.MICROLINK_API_KEY;

      console.log("[DEBUG] Fetching from Microlink:", {
        url: microlinkUrl,
        hasApiKey,
        usingProxy: hasApiKey,
      });

      const microlinkResponse = await fetch(microlinkUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; RCMDBot/1.0; +https://rcmd.world)",
          // Add API key in header for PRO plan authentication
          // Get your API key from: https://microlink.io/dashboard
          ...(process.env.MICROLINK_API_KEY && {
            "x-api-key": process.env.MICROLINK_API_KEY,
          }),
        },
        signal: microlinkController.signal,
      });

      clearTimeout(microlinkTimeout);

      if (!microlinkResponse.ok) {
        const errorText = await microlinkResponse
          .text()
          .catch(() => "Unable to read error");
        console.log(
          `[DEBUG] Microlink returned ${microlinkResponse.status}: ${errorText.substring(0, 200)}`
        );
        throw new Error(`Microlink returned ${microlinkResponse.status}`);
      }

      const microlinkData = await microlinkResponse.json();
      console.log("[DEBUG] Microlink response:", {
        ok: microlinkResponse.ok,
        status: microlinkResponse.status,
        microlinkStatus: microlinkData.status,
        hasData: !!microlinkData.data,
        hasError: !!microlinkData.data?.error,
        errorCode: microlinkData.code,
        title: microlinkData.data?.title?.substring(0, 50),
        description: microlinkData.data?.description?.substring(0, 50),
      });

      // Check if Microlink returned an error (e.g., antibot protection)
      // See: https://microlink.io/blog/antibot-at-scale for error codes
      if (microlinkData.status === "fail" || microlinkData.data?.error) {
        const errorCode = microlinkData.code;
        const errorMessage =
          microlinkData.data?.error || microlinkData.message || "Unknown error";

        console.log("[DEBUG] Microlink failed:", {
          code: errorCode,
          message: errorMessage,
          hasApiKey: !!process.env.MICROLINK_API_KEY,
        });

        // Check for specific antibot error codes
        // EPROXYNEEDED = needs proxy (PRO plan feature)
        // EINVAL = invalid request
        // ETIMEDOUT = timeout
        if (errorCode === "EPROXYNEEDED") {
          console.log(
            "[DEBUG] Microlink detected antibot protection requiring PRO plan proxy"
          );
        }

        throw new Error("Microlink returned error");
      }

      // If Microlink returns valid data, use it
      if (microlinkData.data && !microlinkData.data.error) {
        const metadata = {
          title: microlinkData.data?.title || new URL(url).hostname,
          description:
            microlinkData.data?.description ||
            `Content from ${new URL(url).hostname}`,
          image: microlinkData.data?.image?.url,
          favicon: microlinkData.data?.logo?.url,
          type: microlinkData.data?.type || "website",
          url: microlinkData.data?.url || url,
          author: microlinkData.data?.author,
          publisher: microlinkData.data?.publisher,
          date: microlinkData.data?.date,
          lang: microlinkData.data?.lang,
          logo: microlinkData.data?.logo?.url,
          palette: microlinkData.data?.palette,
          audio: microlinkData.data?.audio,
          video: microlinkData.data?.video,
          iframe: microlinkData.data?.iframe,
        };

        console.log("[DEBUG] Microlink returned valid metadata:", {
          title: metadata.title,
          hasDescription:
            !!metadata.description &&
            metadata.description !== `Content from ${new URL(url).hostname}`,
          hasImage: !!metadata.image,
        });
        return NextResponse.json(metadata);
      } else {
        console.log(
          "[DEBUG] Microlink returned invalid data or error:",
          microlinkData.data?.error || "No data"
        );
        throw new Error("Microlink returned invalid data");
      }
    } catch (microlinkError) {
      clearTimeout(microlinkTimeout);
      // If Microlink fails (timeout or error), continue to direct fetch
      if (microlinkError instanceof Error) {
        if (microlinkError.name === "AbortError") {
          console.log(
            "[DEBUG] Microlink timed out after 10s, trying direct fetch"
          );
        } else {
          console.log(
            `[DEBUG] Microlink error: ${microlinkError.name} - ${microlinkError.message}, trying direct fetch`
          );
        }
      } else {
        console.log("[DEBUG] Microlink unknown error:", microlinkError);
      }
      // Don't throw - continue to direct fetch
    }

    // If Microlink fails, try fetching directly with timeout
    const directController = new AbortController();
    const directTimeout = setTimeout(() => {
      directController.abort();
    }, 8000); // 8 second timeout for direct fetch (increased for slower sites)

    try {
      console.log("[DEBUG] Attempting direct fetch for:", url);
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
        },
        redirect: "follow",
        credentials: "omit",
        signal: directController.signal,
      });

      clearTimeout(directTimeout);

      if (!response.ok) {
        console.log(
          `[DEBUG] Direct fetch returned ${response.status}, using fallback`
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      console.log("[DEBUG] Direct fetch got HTML, length:", text.length);

      // Check if we got a Cloudflare challenge page
      if (
        text.includes("Just a moment") ||
        text.includes("challenge-platform") ||
        text.includes("cf-browser-verification") ||
        text.includes("Enable JavaScript and cookies")
      ) {
        console.log("[DEBUG] Detected Cloudflare challenge page");
        throw new Error("Cloudflare challenge detected");
      }

      // Try using metascraper for better metadata extraction
      try {
        const scraper = metascraper([
          metascraperTitle(),
          metascraperDescription(),
          metascraperImage(),
          metascraperLogo(),
          metascraperAuthor(),
          metascraperPublisher(),
          metascraperUrl(),
        ]);

        const metadata = await scraper({ html: text, url });

        console.log("[DEBUG] Metascraper extracted metadata:", {
          title: metadata.title?.substring(0, 50),
          hasDescription: !!metadata.description,
          hasImage: !!metadata.image,
          hasLogo: !!metadata.logo,
        });

        // If metascraper found good data, use it
        if (metadata.title && metadata.title !== new URL(url).hostname) {
          return NextResponse.json({
            title: metadata.title,
            description:
              metadata.description || `Content from ${new URL(url).hostname}`,
            image: metadata.image || null,
            favicon: metadata.logo || null,
            author: metadata.author || null,
            publisher: metadata.publisher || null,
            type: "website",
            url: metadata.url || url,
          });
        }
      } catch (scraperError) {
        console.log(
          "[DEBUG] Metascraper failed, falling back to regex:",
          scraperError
        );
      }

      // Fallback to regex extraction if metascraper fails
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descriptionMatch = text.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i
      );
      // Also try og:description
      const ogDescriptionMatch = text.match(
        /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i
      );
      const ogImageMatch = text.match(
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["'][^>]*>/i
      );
      const faviconMatch = text.match(
        /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["'][^>]*>/i
      );

      const domain = new URL(url).hostname;
      const baseUrl = new URL(url).origin;

      const extractedTitle = titleMatch?.[1]?.trim();
      const extractedDescription =
        descriptionMatch?.[1]?.trim() || ogDescriptionMatch?.[1]?.trim();

      const metadata = {
        title: extractedTitle || domain,
        description: extractedDescription || `Content from ${domain}`,
        image: ogImageMatch?.[1]
          ? new URL(ogImageMatch[1], baseUrl).toString()
          : null,
        favicon: faviconMatch?.[1]
          ? new URL(faviconMatch[1], baseUrl).toString()
          : `${baseUrl}/favicon.ico`,
        type: "website",
        url: url,
      };

      console.log("[DEBUG] Direct fetch extracted metadata:", {
        title: metadata.title,
        titleIsDomain: metadata.title === domain,
        description: metadata.description?.substring(0, 50),
        descriptionIsFallback:
          metadata.description === `Content from ${domain}`,
        hasImage: !!metadata.image,
        foundTitle: !!extractedTitle,
        foundDescription: !!extractedDescription,
      });

      // Only return if we got actual metadata, not just fallback
      if (extractedTitle && extractedTitle !== domain) {
        return NextResponse.json(metadata);
      } else if (
        extractedDescription &&
        extractedDescription !== `Content from ${domain}`
      ) {
        // Even if title is just domain, if we have a real description, return it
        return NextResponse.json(metadata);
      } else {
        // If we only got fallback data, throw to try other methods or return fallback
        console.log(
          "[DEBUG] Direct fetch only got fallback data, will return fallback"
        );
        throw new Error("Direct fetch returned only fallback data");
      }
    } catch (directError) {
      clearTimeout(directTimeout);
      // Log the error but don't throw - let it fall through to fallback
      if (directError instanceof Error) {
        if (directError.name === "AbortError") {
          console.log("[DEBUG] Direct fetch timed out, using fallback");
        } else {
          console.log(
            `[DEBUG] Direct fetch error: ${directError.message}, using fallback`
          );
        }
      }
      // Don't throw - continue to fallback
    }

    // If we get here, both Microlink and direct fetch failed
    // Try to extract basic info from the URL itself
    console.log(
      "[DEBUG] Both Microlink and direct fetch failed, trying URL-based extraction"
    );
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Try to create a better title from the domain
      const domainParts = domain.replace(/^www\./, "").split(".");
      const siteName = domainParts[0]
        .split(/[-_]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

      return NextResponse.json({
        title: siteName || domain,
        description: `Content from ${domain}`,
        type: "website",
        url: url,
        _fallback: true, // Flag to indicate this is fallback data
      });
    } catch {
      // If even URL parsing fails, return minimal response
      return NextResponse.json({
        title: "Unknown",
        description: "Unable to fetch metadata",
        type: "website",
        url: url,
        _fallback: true,
      });
    }
  } catch (error) {
    console.error("[DEBUG] Unexpected error in fetchMetadata:", error);
    // Return basic metadata as fallback for any unexpected errors
    try {
      const domain = new URL(url).hostname;
      return NextResponse.json({
        title: domain,
        description: `Content from ${domain}`,
        type: "website",
        url: url,
      });
    } catch {
      // If even URL parsing fails, return minimal response
      return NextResponse.json({
        title: "Unknown",
        description: "Unable to fetch metadata",
        type: "website",
        url: url,
      });
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  return fetchMetadata(url || "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return fetchMetadata(body.url || "");
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
