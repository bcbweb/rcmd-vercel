import {
  CollectionWithItems,
  EnhancedCollectionItem,
  RCMD,
  Link,
} from "@/types";
import { createClient } from "@/utils/supabase/client";

/**
 * Fetch a single Collection by its UUID
 */
export const fetchCollectionById = async (
  id: string
): Promise<CollectionWithItems | null> => {
  const supabase = createClient();
  console.log(`[DEBUG] Fetching collection with ID: ${id}`);

  try {
    // Step 1: Fetch the collection basic data
    const { data: collection, error: collectionError } = await supabase
      .from("collections")
      .select(`*`)
      .eq("id", id)
      .single();

    if (collectionError) {
      console.error(`[DEBUG] Error fetching collection:`, collectionError);
      return null;
    }

    if (!collection) {
      console.log(`[DEBUG] Collection not found with ID: ${id}`);
      return null;
    }

    console.log(
      `[DEBUG] Collection found: ${collection.name} (${collection.visibility})`
    );

    // Step 2: Fetch collection items
    const { data: collectionItems, error: itemsError } = await supabase
      .from("collection_items")
      .select("*")
      .eq("collection_id", id)
      .order("order_index", { ascending: true, nullsFirst: false });

    if (itemsError) {
      console.error(`[DEBUG] Error fetching collection items:`, itemsError);
      // Return just the collection without items
      return {
        ...collection,
        collection_items: [],
      };
    }

    console.log(
      `[DEBUG] Retrieved ${collectionItems?.length || 0} collection items`
    );

    // Step 3: Fetch RCMDs and Links
    const rcmdItems =
      collectionItems?.filter(
        (item) => item.item_type === "rcmd" && item.rcmd_id
      ) || [];
    const linkItems =
      collectionItems?.filter(
        (item) => item.item_type === "link" && item.link_id
      ) || [];

    const rcmdIds = rcmdItems.map((item) => item.rcmd_id).filter(Boolean);
    const linkIds = linkItems.map((item) => item.link_id).filter(Boolean);

    console.log(
      `[DEBUG] Found ${rcmdIds.length} RCMD IDs and ${linkIds.length} Link IDs`
    );

    // Fetch RCMDs
    let rcmds: RCMD[] = [];
    if (rcmdIds.length > 0) {
      const { data: rcmdData, error: rcmdError } = await supabase
        .from("rcmds")
        .select("*")
        .in("id", rcmdIds);

      if (rcmdError) {
        console.error(`[DEBUG] Error fetching RCMDs:`, rcmdError);
      } else {
        rcmds = rcmdData || [];
        console.log(`[DEBUG] Retrieved ${rcmds.length} RCMDs`);
      }
    }

    // Fetch Links
    let links: Link[] = [];
    if (linkIds.length > 0) {
      const { data: linkData, error: linkError } = await supabase
        .from("links")
        .select("*")
        .in("id", linkIds);

      if (linkError) {
        console.error(`[DEBUG] Error fetching Links:`, linkError);
      } else {
        links = linkData || [];
        console.log(`[DEBUG] Retrieved ${links.length} Links`);
      }
    }

    // Step 4: Enhance collection items with their related data
    const enhancedItems: EnhancedCollectionItem[] = collectionItems.map(
      (item) => {
        const enhanced: EnhancedCollectionItem = {
          ...item,
        } as EnhancedCollectionItem;

        if (item.item_type === "rcmd" && item.rcmd_id) {
          const rcmd = rcmds.find((r) => r.id === item.rcmd_id);
          enhanced.rcmds = rcmd || null;
          enhanced.rcmd = rcmd || null; // For backward compatibility
        } else if (item.item_type === "link" && item.link_id) {
          const link = links.find((l) => l.id === item.link_id);
          enhanced.links = link || null;
          enhanced.link = link || null; // For backward compatibility
        }

        return enhanced;
      }
    );

    // Step 5: Return the complete collection with items
    const result: CollectionWithItems = {
      ...collection,
      collection_items: enhancedItems,
    };

    // Debug the result
    console.log(
      `[DEBUG] Final result: ${enhancedItems.length} enhanced items`,
      {
        rcmdItemsCount: enhancedItems.filter((item) => item.rcmds || item.rcmd)
          .length,
        linkItemsCount: enhancedItems.filter((item) => item.links || item.link)
          .length,
      }
    );

    return result;
  } catch (error) {
    console.error("[DEBUG] Error fetching collection by ID:", error);
    return null;
  }
};

/**
 * Fetch public Collections with optional pagination
 */
export async function fetchPublicCollections(
  page = 1,
  limit = 10
): Promise<CollectionWithItems[]> {
  const supabase = createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from("collections")
    .select(
      `
      *,
      collection_items (
        id,
        collection_id,
        created_at,
        item_type,
        order_index,
        rcmd_id,
        link_id,
        rcmds:rcmds (
          *,
          profiles:profiles (
            id,
            handle,
            first_name, 
            last_name,
            profile_picture_url
          )
        ),
        links:links (*)
      )
    `
    )
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching public Collections:", error);
    return [];
  }

  return data as CollectionWithItems[];
}
