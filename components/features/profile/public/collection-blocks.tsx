"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { CollectionWithItems } from "@/types";
import PublicCollectionBlocks from "@/components/features/collections/public-collection-blocks";

interface CollectionBlocksProps {
  profileId: string;
}

export default function CollectionBlocks({ profileId }: CollectionBlocksProps) {
  const [collections, setCollections] = useState<CollectionWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCollections() {
      try {
        setIsLoading(true);
        const supabase = createClient();

        const { data, error } = await supabase.rpc(
          "get_public_collections_for_profile",
          {
            profile_id_param: profileId,
          }
        );

        if (error) throw error;

        // Transform the data to match the CollectionWithItems type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const collectionsWithItems = data.map((item: any) => {
          const collection = {
            ...item,
            collection_items: item.items
              ? JSON.parse(JSON.stringify(item.items))
              : [],
          };
          delete collection.items;
          return collection;
        });

        setCollections(collectionsWithItems);
      } catch (err) {
        console.error("Error fetching profile collections:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchCollections();
  }, [profileId]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-gray-200 dark:bg-gray-700 rounded-lg h-40"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Failed to load collections
      </div>
    );
  }

  return <PublicCollectionBlocks collections={collections} />;
}
