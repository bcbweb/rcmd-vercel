import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getUUIDFromShortId } from "@/lib/utils/short-id";
import { SimpleRCMDBlock } from "@/components/features/profile/blocks/rcmd-block";
import { SimpleLinkBlock } from "@/components/features/profile/blocks/link-block";
import { formatDistance } from "date-fns";
import { EnhancedCollectionItem } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const shortId = await params.id;

  let uuid: string;
  try {
    uuid = getUUIDFromShortId(shortId);
  } catch {
    uuid = shortId;
  }

  const supabase = await createClient();
  const { data: collection } = await supabase
    .from("collections")
    .select("*")
    .eq("id", uuid)
    .single();

  if (!collection) {
    return {
      title: "Collection Not Found | RCMD",
    };
  }

  return {
    title: `${collection.name} | RCMD`,
    description: collection.description || "View this collection on RCMD",
  };
}

export default async function CollectionPage({
  params,
}: {
  params: { id: string };
}) {
  const shortId = await params.id;

  // Convert to UUID or use as-is if conversion fails
  let uuid: string;
  try {
    uuid = getUUIDFromShortId(shortId);
  } catch {
    uuid = shortId;
  }

  const supabase = await createClient();

  // Fetch collection with all related data
  const { data: collection, error: fetchError } = await supabase
    .from("collections")
    .select(
      `
      *,
      collection_items (
        *,
        rcmds:rcmd_id (*),
        links:link_id (*)
      )
    `
    )
    .eq("id", uuid)
    .single();

  if (fetchError || !collection) {
    return notFound();
  }

  if (collection.visibility !== "public") {
    return notFound();
  }

  // Process and separate RCMDs and Links
  const rcmdItems = collection.collection_items
    ? collection.collection_items
        .filter(
          (item: EnhancedCollectionItem) =>
            item.item_type === "rcmd" && (item.rcmds || item.rcmd)
        )
        .sort((a: EnhancedCollectionItem, b: EnhancedCollectionItem) => {
          if (a.order_index !== undefined && b.order_index !== undefined) {
            return a.order_index - b.order_index;
          }
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        })
    : [];

  const linkItems = collection.collection_items
    ? collection.collection_items
        .filter(
          (item: EnhancedCollectionItem) =>
            item.item_type === "link" && (item.links || item.link)
        )
        .sort((a: EnhancedCollectionItem, b: EnhancedCollectionItem) => {
          if (a.order_index !== undefined && b.order_index !== undefined) {
            return a.order_index - b.order_index;
          }
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        })
    : [];

  // Format creation date
  const createdDate = collection.created_at
    ? formatDistance(new Date(collection.created_at), new Date(), {
        addSuffix: true,
      })
    : "";

  return (
    <div className="container max-w-6xl py-8">
      {/* Collection Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold mb-2">{collection.name}</h1>

        {collection.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {collection.description}
          </p>
        )}

        {createdDate && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Created {createdDate}
          </p>
        )}
      </div>

      {/* Recommendations Section */}
      {rcmdItems.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rcmdItems.map((item: EnhancedCollectionItem) => {
              const rcmd = item.rcmds || item.rcmd;
              return rcmd ? (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                >
                  <SimpleRCMDBlock rcmd={rcmd} mode="public" />
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Links Section */}
      {linkItems.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {linkItems.map((item: EnhancedCollectionItem) => {
              const link = item.links || item.link;
              return link ? (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                >
                  <SimpleLinkBlock link={link} mode="public" />
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Empty Collection Notice */}
      {rcmdItems.length === 0 && linkItems.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            This collection doesn't have any items yet.
          </p>
        </div>
      )}
    </div>
  );
}
