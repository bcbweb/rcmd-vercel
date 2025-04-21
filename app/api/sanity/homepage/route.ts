import { client } from "@/lib/sanity";
import { NextRequest, NextResponse } from "next/server";

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
    return NextResponse.json(
      { error: "Failed to fetch homepage data" },
      { status: 500 }
    );
  }
}
