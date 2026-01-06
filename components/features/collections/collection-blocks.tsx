"use client";

import { useState, useEffect, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DraggableCollectionBlock from "./draggable-collection-block";
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
  onMove?: (dragIndex: number, hoverIndex: number) => void;
}

export default function CollectionBlocks({
  initialCollectionBlocks = [],
  onDelete,
  onSave,
  onMove,
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

  // Handle move locally for immediate UI feedback
  const handleMove = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      setCollectionBlocks((prevBlocks) => {
        const newBlocks = [...prevBlocks];
        const [removed] = newBlocks.splice(dragIndex, 1);
        newBlocks.splice(hoverIndex, 0, removed);
        return newBlocks;
      });
      // Call parent's onMove to persist the change
      onMove?.(dragIndex, hoverIndex);
    },
    [onMove]
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collectionBlocks.map((block, index) =>
          block.collection_id && collectionsMap[block.collection_id] ? (
            <DraggableCollectionBlock
              key={block.id}
              collectionBlock={block}
              index={index}
              collection={collectionsMap[block.collection_id]}
              onMove={handleMove}
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
    </DndProvider>
  );
}
