import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getShortIdFromUUID } from "@/lib/utils/short-id";

// Set revalidation period for ISR
export const revalidate = 60;

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  // Properly await params in Next.js 15
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // We'll redirect to the new route if accessed, but still generate metadata correctly
  const supabase = await createClient();

  try {
    const { data: collection } = await supabase
      .from("collections")
      .select("name, description")
      .eq("id", id)
      .single();

    if (!collection) {
      return {
        title: "Collection Not Found",
        description: "The collection you are looking for could not be found.",
      };
    }

    return {
      title: `${collection.name} | RCMD Collection`,
      description:
        collection.description || `View ${collection.name} collection on RCMD`,
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "RCMD Collection",
      description: "View this collection on RCMD",
    };
  }
}

export default async function CollectionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Always await params in Next.js to avoid warnings
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Redirect to new collection route with shortId
  const shortId = getShortIdFromUUID(id);
  redirect(`/collection/${shortId}`);
}
