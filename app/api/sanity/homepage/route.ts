import { client } from "@/lib/sanity";
import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering to avoid build-time issues
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fields = searchParams.get("fields");

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

    const query = `*[_type == "homepage"][0] ${projection}`;
    const data = await client.fetch(query);

    return NextResponse.json(data || {}, { status: 200 });
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    // Return empty object instead of error to prevent build failures
    return NextResponse.json({}, { status: 200 });
  }
}
