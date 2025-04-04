"use client";

import { useState, useEffect } from "react";
import { CollectionBlock } from "@/components/features/profile/blocks";
import type { CollectionBlockType } from "@/types";

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

  useEffect(() => {
    setCollectionBlocks(initialCollectionBlocks);
  }, [initialCollectionBlocks]);

  return (
    <div className="space-y-4">
      {collectionBlocks.map((block) => (
        <CollectionBlock
          key={block.id}
          collection={block}
          onDelete={
            onDelete && block.collection_id
              ? () => onDelete(block.collection_id!)
              : undefined
          }
          onSave={onSave}
        />
      ))}

      {collectionBlocks.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No collections found
        </div>
      )}
    </div>
  );
}
