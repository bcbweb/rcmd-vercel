"use client";

import type { CollectionWithItems, RCMD } from "@/types";
import { Calendar, Box, Eye } from "lucide-react";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { CompactCarousel, RCMDCard } from "@/components/common/carousel";
import { getShortIdFromUUID } from "@/lib/utils/short-id";

interface Props {
  collections: CollectionWithItems[];
}

// Minimal RCMD type with required fields
interface MinimalRCMD {
  id: string;
  title: string;
  type: string;
  visibility: string;
  created_at: string;
  view_count?: number;
  like_count?: number;
  save_count?: number;
  share_count?: number;
  description?: string | null;
  featured_image?: string | null;
  tags?: string[];
}

export default function PublicCollectionBlocks({ collections }: Props) {
  // Early return if no collections
  if (!collections || collections.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No collections found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => {
          // Debug collection items
          console.log(
            `Collection ${collection.id} items:`,
            collection.collection_items
          );

          // Create RCMD cards for the carousel with more flexible filtering
          const rcmdCards =
            collection.collection_items
              ?.filter((item) => {
                // More detailed checks and debugging
                if (!item) return false;

                // Check item_type
                const isRcmdType = item.item_type === "rcmd";

                // Check for rcmd presence in multiple possible formats
                const hasRcmd =
                  // Direct rcmd property
                  !!item.rcmd ||
                  // Might have rcmd_id as an object with id property
                  (item.rcmd_id &&
                    typeof item.rcmd_id === "object" &&
                    "id" in item.rcmd_id) ||
                  // Might have rcmd_id as a string
                  (item.rcmd_id && typeof item.rcmd_id === "string");

                console.log(
                  `Item ${item.id}: isRcmdType=${isRcmdType}, hasRcmd=${hasRcmd}`
                );

                return isRcmdType && hasRcmd;
              })
              .map((item) => {
                // Find the actual RCMD object to pass to the card
                let rcmd = item.rcmd as RCMD | undefined;

                // If we don't have direct rcmd object but have rcmd_id reference
                if (!rcmd && item.rcmd_id) {
                  console.log(
                    "Using rcmd_id instead of direct rcmd object:",
                    item.rcmd_id
                  );

                  // Extract the ID properly based on type
                  const rcmdId =
                    typeof item.rcmd_id === "object" &&
                    item.rcmd_id &&
                    "id" in item.rcmd_id
                      ? (item.rcmd_id as { id: string }).id
                      : String(item.rcmd_id);

                  // Create a minimal rcmd object for display
                  const minimalRcmd: MinimalRCMD = {
                    id: rcmdId,
                    title: "RCMD " + rcmdId.substring(0, 8),
                    type: "other",
                    visibility: "public",
                    created_at: item.created_at || new Date().toISOString(),
                    view_count: 0,
                    like_count: 0,
                    save_count: 0,
                    share_count: 0,
                    featured_image: "/images/default-image.jpg",
                  };

                  rcmd = minimalRcmd as unknown as RCMD;
                } else if (rcmd) {
                  // Log the image URL for debugging
                  console.log(`RCMD ${rcmd.id} image:`, rcmd.featured_image);
                }

                // Safety check - if somehow we still don't have an RCMD object, return null
                if (!rcmd) {
                  console.error("Failed to create RCMD card for item:", item);
                  return null;
                }

                return <RCMDCard key={rcmd.id} rcmd={rcmd} />;
              })
              .filter(Boolean) || []; // Filter out any null values

          console.log(
            `Collection ${collection.id} has ${rcmdCards.length} RCMD cards`
          );

          return (
            <div
              key={collection.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-4">
                <h3 className="text-lg font-medium line-clamp-1 mb-2">
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
                    {collection.description}
                  </p>
                )}
                {/* RCMD Carousel */}
                {rcmdCards.length > 0 && (
                  <div className="-mx-1 mt-2 mb-3">
                    <CompactCarousel items={rcmdCards} cardsPerView={1} />
                  </div>
                )}
                {rcmdCards.length === 0 && (
                  <div className="text-center py-2 text-gray-500 dark:text-gray-400 text-sm bg-gray-100 dark:bg-gray-700 rounded-md">
                    No RCMDs in this collection
                  </div>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {collection.created_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDistance(
                          new Date(collection.created_at),
                          new Date(),
                          {
                            addSuffix: true,
                          }
                        )}
                      </span>
                    </div>
                  )}

                  {collection.collection_items && (
                    <div className="flex items-center gap-1">
                      <Box className="h-3 w-3" />
                      <span>
                        {Array.isArray(collection.collection_items)
                          ? `${collection.collection_items.length} items`
                          : "0 items"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <Link
                    href={`/collection/${getShortIdFromUUID(collection.id)}`}
                    className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    View collection
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
