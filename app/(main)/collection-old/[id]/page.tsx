import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { fetchCollectionById } from "@/lib/api/collections";
import { SimpleRCMDBlock } from "@/components/features/profile/blocks/rcmd-block";
import { SimpleLinkBlock } from "@/components/features/profile/blocks/link-block";
import { formatDistance } from "date-fns";
import { EnhancedCollectionItem } from "@/types";
import { getUUIDFromShortId } from "@/lib/utils/short-id";

// Type guard functions with more detailed validation
function isRCMDItem(
  item: EnhancedCollectionItem
): item is EnhancedCollectionItem & { item_type: "rcmd" } {
  // Check both old and new property names
  const hasRcmd = item.item_type === "rcmd" && (!!item.rcmd || !!item.rcmds);
  if (!hasRcmd) {
    console.log(`Item failed RCMD validation:`, {
      id: item.id,
      item_type: item.item_type,
      hasOldProp: !!item.rcmd,
      hasNewProp: !!item.rcmds,
      rcmdKeys: item.rcmd
        ? Object.keys(item.rcmd)
        : item.rcmds
          ? Object.keys(item.rcmds)
          : null,
    });
  }
  return hasRcmd;
}

function isLinkItem(
  item: EnhancedCollectionItem
): item is EnhancedCollectionItem & { item_type: "link" } {
  // Check both old and new property names
  const hasLink = item.item_type === "link" && (!!item.link || !!item.links);
  if (!hasLink) {
    console.log(`Item failed Link validation:`, {
      id: item.id,
      item_type: item.item_type,
      hasOldProp: !!item.link,
      hasNewProp: !!item.links,
      linkKeys: item.link
        ? Object.keys(item.link)
        : item.links
          ? Object.keys(item.links)
          : null,
    });
  }
  return hasLink;
}

// Helper function to validate and convert shortId to UUID
function validateAndConvertId(id: string): string {
  // Check if the id is already a valid UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    console.log(`ID is already in UUID format: ${id}`);
    return id;
  }

  try {
    // Try to convert shortId to UUID
    const uuid = getUUIDFromShortId(id);
    console.log(`Successfully converted shortId ${id} to UUID: ${uuid}`);
    return uuid;
  } catch (error) {
    console.error(`Error converting shortId to UUID:`, error);
    console.log(`Will attempt to use original ID: ${id}`);
    return id;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    // Await params before using its properties in Next.js 15
    const resolvedParams = await params;
    const shortId = resolvedParams.id;
    console.log(`Generating metadata for collection ID (short): ${shortId}`);

    // Convert short ID to UUID with validation
    const uuid = validateAndConvertId(shortId);
    const collection = await fetchCollectionById(uuid);

    if (!collection || collection.visibility !== "public") {
      console.log(
        `Collection not found or not public: ${shortId} (UUID: ${uuid})`
      );
      return {
        title: "Collection Not Found",
        description:
          "The requested collection could not be found or is not public.",
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://rcmd.io";

    console.log(`Metadata generated for collection: ${collection.name}`);
    return {
      title: collection.name,
      description: collection.description || `Check out this collection`,
      openGraph: {
        title: collection.name,
        description: collection.description || `Check out this collection`,
        url: `${baseUrl}/collection/${shortId}`,
      },
    };
  } catch (error) {
    console.error(`Error generating metadata:`, error);
    return {
      title: "Collection",
      description: "View this collection",
    };
  }
}

// Process RCMD items with detailed logging
function processRCMDItems(
  items: EnhancedCollectionItem[] | undefined
): EnhancedCollectionItem[] {
  console.log(`Processing RCMD items, total items: ${items?.length || 0}`);
  if (!items || items.length === 0) {
    console.log("No items to process for RCMDs");
    return [];
  }

  // Debug log all items
  console.log(
    "All collection items before filtering:",
    items.map((item) => ({
      id: item.id,
      type: item.item_type,
      hasRcmd: item.item_type === "rcmd" && (!!item.rcmd || !!item.rcmds),
      hasLink: item.item_type === "link" && (!!item.link || !!item.links),
      order_index: item.order_index,
      keys: Object.keys(item),
    }))
  );

  const rcmdItems = items.filter(isRCMDItem);
  console.log(`Found ${rcmdItems.length} RCMD items after filtering`);

  // Log each RCMD item in detail
  rcmdItems.forEach((item, index) => {
    const rcmdData = getRCMDData(item);
    const description = rcmdData?.description || "";
    const truncatedDescription =
      description.substring(0, 30) + (description.length > 30 ? "..." : "");

    console.log(`RCMD item ${index + 1}:`, {
      id: item.id,
      rcmdId: rcmdData?.id,
      title: rcmdData?.title,
      order_index: item.order_index,
      created_at: item.created_at,
      description: truncatedDescription,
      hasImage:
        rcmdData && "image_url" in rcmdData ? !!rcmdData.image_url : false,
    });
  });

  // Sort by order_index or created_at
  const sortedItems = [...rcmdItems].sort((a, b) => {
    // If both have order_index, sort by that
    if (a.order_index !== undefined && b.order_index !== undefined) {
      return a.order_index - b.order_index;
    }
    // If only one has order_index, prioritize the one with order_index
    if (a.order_index !== undefined) return -1;
    if (b.order_index !== undefined) return 1;
    // Otherwise sort by created_at
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  console.log(`Sorted ${sortedItems.length} RCMD items`);
  console.log(
    `Order sequence:`,
    sortedItems.map((item) => {
      const rcmdData = getRCMDData(item);
      const title = rcmdData?.title || "";
      return {
        id: item.id.substring(0, 6),
        title: title.substring(0, 15) + (title.length > 15 ? "..." : ""),
        order_index: item.order_index,
        created: new Date(item.created_at).toISOString().substring(0, 19),
      };
    })
  );

  return sortedItems;
}

// Process Link items with detailed logging
function processLinkItems(
  items: EnhancedCollectionItem[] | undefined
): EnhancedCollectionItem[] {
  console.log(`Processing Link items, total items: ${items?.length || 0}`);
  if (!items || items.length === 0) {
    console.log("No items to process for Links");
    return [];
  }

  const linkItems = items.filter(isLinkItem);
  console.log(`Found ${linkItems.length} Link items after filtering`);

  // Log each Link item in detail
  linkItems.forEach((item, index) => {
    const linkData = getLinkData(item);
    console.log(`Link item ${index + 1}:`, {
      id: item.id,
      linkId: linkData?.id,
      title: linkData?.title,
      url: linkData?.url,
      order_index: item.order_index,
      created_at: item.created_at,
      hasFavicon:
        linkData && "favicon_url" in linkData ? !!linkData.favicon_url : false,
    });
  });

  // Sort by order_index or created_at
  const sortedItems = [...linkItems].sort((a, b) => {
    // If both have order_index, sort by that
    if (a.order_index !== undefined && b.order_index !== undefined) {
      return a.order_index - b.order_index;
    }
    // If only one has order_index, prioritize the one with order_index
    if (a.order_index !== undefined) return -1;
    if (b.order_index !== undefined) return 1;
    // Otherwise sort by created_at
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  console.log(`Sorted ${sortedItems.length} Link items`);
  console.log(
    `Order sequence:`,
    sortedItems.map((item) => {
      const linkData = getLinkData(item);
      const title = linkData?.title || "";
      return {
        id: item.id.substring(0, 6),
        title: title.substring(0, 15) + (title.length > 15 ? "..." : ""),
        order_index: item.order_index,
        created: new Date(item.created_at).toISOString().substring(0, 19),
      };
    })
  );

  return sortedItems;
}

// Helper functions to get rcmd/link data from either property name
function getRCMDData(item: EnhancedCollectionItem) {
  return item.rcmd || item.rcmds;
}

function getLinkData(item: EnhancedCollectionItem) {
  return item.link || item.links;
}

export default async function CollectionPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    // Await params before using its properties in Next.js 15
    const resolvedParams = await params;
    const shortId = resolvedParams.id;
    console.log(`Fetching collection with ID (short): ${shortId}`);

    // First, try to validate and convert to UUID
    const uuid = validateAndConvertId(shortId);
    console.log(`Using UUID for fetch: ${uuid}`);

    // Fetch collection with the validated UUID
    console.log(`Attempting to fetch collection with UUID: ${uuid}`);
    const collection = await fetchCollectionById(uuid);
    console.log(`Fetch result: ${collection ? "Success" : "Not found"}`);

    // Handle not found case
    if (!collection) {
      console.log(`Collection not found with ID: ${shortId} (UUID: ${uuid})`);
      notFound();
    }

    // Handle visibility restrictions
    if (collection.visibility !== "public") {
      console.log(`Collection is not public: ${collection.id}`);
      redirect("/");
    }

    console.log(`----- Collection Analysis: ${collection.name} -----`);
    console.log(`Collection Details:`, {
      id: collection.id,
      name: collection.name,
      visibility: collection.visibility,
      created_at: collection.created_at,
      profile_id: collection.profile_id,
      itemsCount: collection.collection_items?.length || 0,
    });

    // Detailed inspection of collection_items array
    if (collection.collection_items && collection.collection_items.length > 0) {
      console.log(`Item Types Distribution:`, {
        total: collection.collection_items.length,
        rcmdItems: collection.collection_items.filter(
          (item) => item.item_type === "rcmd"
        ).length,
        linkItems: collection.collection_items.filter(
          (item) => item.item_type === "link"
        ).length,
        unknownItems: collection.collection_items.filter(
          (item) => !["rcmd", "link"].includes(item.item_type)
        ).length,
      });

      console.log(
        `Items with order_index:`,
        collection.collection_items.filter(
          (item) => item.order_index !== undefined && item.order_index !== null
        ).length
      );

      console.log(
        `First few items raw data:`,
        collection.collection_items.slice(0, 2).map((item) => ({
          id: item.id,
          type: item.item_type,
          order: item.order_index,
          created: item.created_at,
          rcmd: getRCMDData(item)
            ? { id: getRCMDData(item)!.id, title: getRCMDData(item)!.title }
            : null,
          link: getLinkData(item)
            ? { id: getLinkData(item)!.id, title: getLinkData(item)!.title }
            : null,
          itemKeys: Object.keys(item),
        }))
      );
    } else {
      console.log(`No collection items found`);
    }

    // Process items
    const rcmdItems = processRCMDItems(collection.collection_items);
    const linkItems = processLinkItems(collection.collection_items);

    console.log(
      `Final counts - RCMDs: ${rcmdItems.length}, Links: ${linkItems.length}`
    );
    console.log(`----- End Collection Analysis -----`);

    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{collection.name}</h1>
          {collection.description && (
            <p className="text-gray-600 mb-4">{collection.description}</p>
          )}
          <p className="text-sm text-gray-500">
            Created{" "}
            {formatDistance(
              new Date(collection.created_at || Date.now()),
              new Date(),
              { addSuffix: true }
            )}
          </p>
        </div>

        {rcmdItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {rcmdItems
                .filter((item) => getRCMDData(item))
                .map((item) => (
                  <SimpleRCMDBlock
                    key={item.id}
                    rcmd={getRCMDData(item)!}
                    mode="public"
                  />
                ))}
            </div>
          </div>
        )}

        {linkItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Links</h2>
            <div className="space-y-4">
              {linkItems
                .filter((item) => getLinkData(item))
                .map((item) => (
                  <SimpleLinkBlock
                    key={item.id}
                    link={getLinkData(item)!}
                    mode="public"
                  />
                ))}
            </div>
          </div>
        )}

        {!rcmdItems.length && !linkItems.length && (
          <div className="text-center py-12">
            <p className="text-gray-500">This collection is empty</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error(`Error rendering collection page:`, error);
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-500">We couldn't load this collection</p>
        </div>
      </div>
    );
  }
}
