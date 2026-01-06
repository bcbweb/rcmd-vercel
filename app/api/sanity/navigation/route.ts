import { client } from "@/lib/sanity";
import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering to avoid build-time issues
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get("identifier") || "main";

  try {
    // Get navigation by identifier with resolved internal links
    const query = `
      *[_type == "navigation" && identifier == $identifier][0] {
        ...,
        "items": items[] {
          ...,
          "internalLink": internalLink-> {
            "_id": _id,
            "title": title,
            "slug": slug.current
          },
          "children": children[] {
            ...,
            "internalLink": internalLink-> {
              "_id": _id,
              "title": title,
              "slug": slug.current
            }
          }
        }
      }
    `;

    const data = await client.fetch(query, { identifier });

    if (!data) {
      return NextResponse.json(
        { error: `Navigation with identifier '${identifier}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching navigation data:", error);
    return NextResponse.json(
      { error: "Failed to fetch navigation data" },
      { status: 500 }
    );
  }
}
