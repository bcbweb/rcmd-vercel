"use client";

import { CollectionBlockType } from "@/types";
import CollectionBlock from "@/components/profile/blocks/collection-block";

interface CollectionListProps {
  collections: CollectionBlockType[];
  onDelete?: (id: string) => void;
  onUpdate?: (block: Partial<CollectionBlockType>) => void;
}

export default function CollectionList({
  collections,
  onDelete,
  onUpdate,
}: CollectionListProps) {
  if (!collections.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          No collections yet. Create one to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {collections.map((collection) => (
        <CollectionBlock
          key={collection.id}
          collection={collection}
          onDelete={
            onDelete && collection.collection_id
              ? () => onDelete(collection.collection_id!)
              : undefined
          }
          onUpdate={onUpdate ? () => onUpdate(collection) : undefined}
        />
      ))}
    </div>
  );
}