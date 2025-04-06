import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Add a timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; RCMDBot/1.0; +https://rcmd.world)",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          {
            error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
          },
          { status: 500 }
        );
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        return NextResponse.json({
          title: urlObj.hostname,
          description: `Content from ${urlObj.hostname}`,
          type: contentType.split(";")[0],
        });
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const metadata = {
        // Prioritize OG title first, then fallback to document title
        title:
          $('meta[property="og:title"]').attr("content") ||
          $("title")
            .first()
            .contents()
            .filter((_, el) => el.type === "text")
            .text()
            .trim() ||
          urlObj.hostname,
        description:
          $('meta[name="description"]').attr("content") ||
          $('meta[property="og:description"]').attr("content") ||
          "",
        image:
          $('meta[property="og:image"]').attr("content") ||
          $('meta[property="twitter:image"]').attr("content"),
        favicon: new URL(
          $('link[rel="icon"]').attr("href") ||
            $('link[rel="shortcut icon"]').attr("href") ||
            "/favicon.ico",
          urlObj.origin
        ).toString(),
        type: $('meta[property="og:type"]').attr("content") || "website",
      };

      return NextResponse.json(metadata);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timed out" },
          { status: 408 }
        );
      }

      // Fall back to basic response with just the domain
      return NextResponse.json({
        title: urlObj.hostname,
        description: `Content from ${urlObj.hostname}`,
        type: "website",
      });
    }
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
