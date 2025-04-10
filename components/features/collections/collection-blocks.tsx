"use client";

import { useState, useEffect } from "react";
import { CollectionBlock } from "@/components/features/profile/blocks";
import type { CollectionBlockType, CollectionWithItems } from "@/types";
import React from "react";
import { useCollectionStore } from "@/stores/collection-store";

// Extended block type to include _collection property
interface ExtendedCollectionBlock extends Partial<CollectionBlockType> {
  _collection?: {
    rcmdIds: string[];
    linkIds: string[];
    collection_items?: Record<string, unknown>[];
    [key: string]: unknown;
  };
}

interface Props {
  initialCollectionBlocks?: CollectionBlockType[];
  onDelete?: (id: string) => void;
  onSave?: (block: ExtendedCollectionBlock) => void;
}

export default function CollectionBlocks({
  initialCollectionBlocks = [],
  onDelete,
  onSave,
}: Props) {
  const [collectionBlocks, setCollectionBlocks] = useState<
    CollectionBlockType[]
  >(initialCollectionBlocks);

  // Get collections directly from the store instead of maintaining local state
  const storeCollections = useCollectionStore((state) => state.collections);

  // Convert store collections to a map for easier access
  const collectionsMap = React.useMemo(() => {
    return storeCollections.reduce<{
      [key: string]: CollectionWithItems;
    }>((acc, collection) => {
      acc[collection.id] = collection as CollectionWithItems;
      return acc;
    }, {});
  }, [storeCollections]);

  // Keep collection blocks in sync with initialCollectionBlocks prop
  useEffect(() => {
    setCollectionBlocks(initialCollectionBlocks);
  }, [initialCollectionBlocks]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {collectionBlocks.map((block) =>
        block.collection_id && collectionsMap[block.collection_id] ? (
          <CollectionBlock
            key={block.id}
            collection={collectionsMap[block.collection_id]}
            onDelete={
              onDelete ? () => onDelete(block.collection_id!) : undefined
            }
            onSave={
              onSave
                ? (updatedBlock) => {
                    console.log(
                      "Received updatedBlock from CollectionBlock, forwarding to page:",
                      updatedBlock
                    );
                    onSave(updatedBlock);
                  }
                : undefined
            }
          />
        ) : null
      )}

      {collectionBlocks.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 col-span-full">
          No collections found
        </div>
      )}
    </div>
  );
}
