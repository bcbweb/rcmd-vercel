"use client";

import { useState, useEffect } from "react";
import { CollectionBlock } from "@/components/features/profile/blocks";
import type { CollectionBlockType, CollectionWithItems } from "@/types";
import { createClient } from "@/utils/supabase/client";

interface Props {
  initialCollectionBlocks?: CollectionBlockType[];
  onDelete?: (id: string) => void;
  onSave?: (block: Partial<CollectionBlockType>) => void;
}

export default function CollectionBlocks({
  initialCollectionBlocks = [],
  onDelete,
  onSave,
}: Props) {
  const [collectionBlocks, setCollectionBlocks] = useState<
    CollectionBlockType[]
  >(initialCollectionBlocks);

  const [collections, setCollections] = useState<{
    [key: string]: CollectionWithItems;
  }>({});

  useEffect(() => {
    setCollectionBlocks(initialCollectionBlocks);
  }, [initialCollectionBlocks]);

  useEffect(() => {
    const fetchCollections = async () => {
      const supabase = createClient();
      const collectionIds = collectionBlocks
        .map((block) => block.collection_id)
        .filter((id): id is string => id !== null);

      if (collectionIds.length === 0) return;

      const { data, error } = await supabase
        .from("collections")
        .select(`*, collection_items(*, rcmd:rcmd_id(*))`)
        .in("id", collectionIds);

      if (error) {
        console.error("Error fetching collections:", error);
        return;
      }

      const collectionsMap = (data || []).reduce<{
        [key: string]: CollectionWithItems;
      }>((acc, collection) => {
        acc[collection.id] = collection as CollectionWithItems;
        return acc;
      }, {});

      setCollections(collectionsMap);
    };

    fetchCollections();
  }, [collectionBlocks]);

  return (
    <div className="space-y-4">
      {collectionBlocks.map((block) =>
        block.collection_id && collections[block.collection_id] ? (
          <CollectionBlock
            key={block.id}
            collection={collections[block.collection_id]}
            onDelete={
              onDelete ? () => onDelete(block.collection_id!) : undefined
            }
            onSave={onSave ? () => onSave(block) : undefined}
          />
        ) : null
      )}

      {collectionBlocks.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No collections found
        </div>
      )}
    </div>
  );
}
