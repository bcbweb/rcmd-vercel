export const dynamic = "force-dynamic";
export const dynamicParams = true;

import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import PublicCollectionBlocks from "@/components/features/collections/public-collection-blocks";
import type { CollectionWithItems } from "@/types";

// Set revalidation period for ISR (60 seconds for more frequent updates)
export const revalidate = 60;

interface Params {
  handle: string;
}

export default async function ProfileCollectionsPage({
  params,
}: {
  params: Params;
}) {
  // Await the params destructuring to ensure it's ready
  const { handle } = await Promise.resolve(params);

  if (!handle) {
    return notFound();
  }

  // Create server-side supabase client
  const supabase = await createClient();

  // Fetch profile info first
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching profile:", profileError);
    return notFound();
  }

  try {
    // Track view count
    await supabase.rpc("increment_profile_view", { profile_id: profile.id });

    // Fetch collections server-side using RPC
    const { data: collectionsData, error: collectionsError } =
      await supabase.rpc("get_public_collections_for_profile", {
        profile_id_param: profile.id,
      });

    if (collectionsError) {
      console.error("Error fetching collections:", collectionsError);
      throw collectionsError;
    }

    // Transform the data to match the CollectionWithItems type
    interface CollectionData extends Record<string, unknown> {
      items?: unknown;
    }

    const collections = collectionsData.map((item: CollectionData) => {
      const { items, ...rest } = item;

      // Log the raw data structure for debugging
      console.log(`Collection ${rest.id} raw data:`, {
        itemsType: typeof items,
        itemsLength: items
          ? Array.isArray(items)
            ? items.length
            : "Not an array"
          : "undefined",
      });

      return {
        ...rest,
        collection_items: items ? JSON.parse(JSON.stringify(items)) : [],
      };
    }) as CollectionWithItems[];

    // Log the transformed collections for debugging
    console.log(`Transformed ${collections.length} collections with items`);
    if (collections.length > 0) {
      const sampleCollection = collections[0];
      console.log(
        `Sample collection ${sampleCollection.id} has ${sampleCollection.collection_items?.length || 0} items`
      );
      if (
        sampleCollection.collection_items &&
        sampleCollection.collection_items.length > 0
      ) {
        const sampleItem = sampleCollection.collection_items[0];
        console.log(
          `Sample item: ${JSON.stringify({
            id: sampleItem.id,
            type: sampleItem.item_type,
            hasRcmd: !!sampleItem.rcmd,
            rcmdId: sampleItem.rcmd_id,
          })}`
        );
      }
    }

    // If we have zero collections, show a friendly message
    if (!collections || collections.length === 0) {
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">No Collections yet</h2>
          <p className="text-gray-600 dark:text-gray-400">
            This user hasn't created any collections yet.
          </p>
        </div>
      );
    }

    // Return the Collections grid
    return (
      <div className="w-full">
        <PublicCollectionBlocks collections={collections} />
      </div>
    );
  } catch (error) {
    console.error("Error in ProfileCollectionsPage:", error);
    throw error;
  }
}
