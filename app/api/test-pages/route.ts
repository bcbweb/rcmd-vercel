import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Get profileId from query string
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Test 1: Fetch pages with profile_id
    const { data: pages, error: pagesError } = await supabase
      .from("profile_pages")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: true });

    if (pagesError) {
      return NextResponse.json({ error: pagesError.message }, { status: 500 });
    }

    // Test 2: Fetch profile info
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("default_page_type, default_page_id")
      .eq("id", profileId)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pagesCount: pages?.length || 0,
      pages: pages || [],
      profile: profile || {},
    });
  } catch (error) {
    console.error("Error in test pages route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
