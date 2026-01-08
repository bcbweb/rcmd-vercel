import { NextResponse } from "next/server";

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
      const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&palette=true&audio=true&video=true&iframe=true`;
      const microlinkResponse = await fetch(microlinkUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; RCMDBot/1.0; +https://rcmd.world)",
        },
        signal: microlinkController.signal,
      });

      clearTimeout(microlinkTimeout);

      if (!microlinkResponse.ok) {
        console.log(
          `[DEBUG] Microlink returned ${microlinkResponse.status}, trying direct fetch`
        );
        throw new Error(`Microlink returned ${microlinkResponse.status}`);
      }

      const microlinkData = await microlinkResponse.json();
      console.log("[DEBUG] Microlink response:", {
        ok: microlinkResponse.ok,
        hasData: !!microlinkData.data,
        hasError: !!microlinkData.data?.error,
        status: microlinkResponse.status,
      });

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

        console.log("[DEBUG] Microlink returned valid metadata");
        return NextResponse.json(metadata);
      } else {
        console.log(
          "[DEBUG] Microlink returned invalid data or error, trying direct fetch"
        );
        throw new Error("Microlink returned invalid data");
      }
    } catch (microlinkError) {
      clearTimeout(microlinkTimeout);
      // If Microlink fails (timeout or error), continue to direct fetch
      if (microlinkError instanceof Error) {
        if (microlinkError.name === "AbortError") {
          console.log("[DEBUG] Microlink timed out, trying direct fetch");
        } else {
          console.log(
            `[DEBUG] Microlink error: ${microlinkError.message}, trying direct fetch`
          );
        }
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

      // Use regex to extract basic metadata
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descriptionMatch = text.match(
        /<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i
      );
      const ogImageMatch = text.match(
        /<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i
      );
      const faviconMatch = text.match(
        /<link[^>]*rel="(?:shortcut )?icon"[^>]*href="([^"]*)"[^>]*>/i
      );

      const domain = new URL(url).hostname;
      const baseUrl = new URL(url).origin;

      const metadata = {
        title: titleMatch?.[1]?.trim() || domain,
        description: descriptionMatch?.[1]?.trim() || `Content from ${domain}`,
        image: ogImageMatch?.[1]
          ? new URL(ogImageMatch[1], baseUrl).toString()
          : null,
        favicon: faviconMatch?.[1]
          ? new URL(faviconMatch[1], baseUrl).toString()
          : `${baseUrl}/favicon.ico`,
        type: "website",
        url: url,
      };

      console.log("[DEBUG] Direct fetch returned metadata:", {
        title: metadata.title,
        hasDescription: !!metadata.description,
        hasImage: !!metadata.image,
      });

      return NextResponse.json(metadata);
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
    // Return fallback metadata
    console.log(
      "[DEBUG] Both Microlink and direct fetch failed, returning fallback"
    );
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
