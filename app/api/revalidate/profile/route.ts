import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// This API route allows for on-demand revalidation of profile pages
// It can be called when content changes to immediately update the ISR cached pages
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { handle, secret } = body;

    // Validate the secret to prevent unauthorized revalidations
    // This should match an environment variable SECRET that you set
    const validationSecret = process.env.REVALIDATION_SECRET;
    if (!validationSecret || secret !== validationSecret) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    // Validate that we have a handle
    if (!handle || typeof handle !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid handle" },
        { status: 400 }
      );
    }

    // Get the profile ID from handle to fetch all associated pages
    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", handle)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Fetch all pages for this profile to revalidate them too
    const { data: pages } = await supabase
      .from("profile_pages")
      .select("slug")
      .eq("profile_id", profile.id);

    // Revalidate the main profile page
    revalidatePath(`/${handle}`);

    // Revalidate all content type pages
    revalidatePath(`/${handle}/rcmds`);
    revalidatePath(`/${handle}/links`);
    revalidatePath(`/${handle}/collections`);

    // Revalidate all custom pages
    if (pages && pages.length > 0) {
      for (const page of pages) {
        revalidatePath(`/${handle}/${page.slug}`);
      }
    }

    return NextResponse.json({
      revalidated: true,
      paths: [
        `/${handle}`,
        `/${handle}/rcmds`,
        `/${handle}/links`,
        `/${handle}/collections`,
        ...(pages?.map((page) => `/${handle}/${page.slug}`) || []),
      ],
    });
  } catch (error) {
    console.error("Error revalidating:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}
