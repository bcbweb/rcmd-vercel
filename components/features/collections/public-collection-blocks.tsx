"use client";

import type { CollectionWithItems } from "@/types";
import { Calendar, Box, Eye } from "lucide-react";
import { formatDistance } from "date-fns";
import Link from "next/link";

interface Props {
  collections: CollectionWithItems[];
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
        {collections.map((collection) => (
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
                  href={`/collections/${collection.id}`}
                  className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Eye className="mr-1 h-4 w-4" />
                  View collection
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
