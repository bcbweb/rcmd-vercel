import { client } from "@/lib/sanity";
import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering to avoid build-time issues
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const fields = searchParams.get("fields");

  if (!slug) {
    return NextResponse.json(
      { error: "Slug parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Default projection to fetch all fields
    let projection = "*";

    // If specific fields are requested, only fetch those
    if (fields) {
      const fieldList = fields.split(",");
      projection = `{
        ${fieldList.map((field) => `"${field}": ${field}`).join(",")}
      }`;
    }

    const query = `*[_type == "page" && slug.current == $slug][0] ${projection}`;
    const data = await client.fetch(query, { slug });

    if (!data) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching page data:", error);
    return NextResponse.json(
      { error: "Failed to fetch page data" },
      { status: 500 }
    );
  }
}
