"use client";

import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { CollectionBlock } from "@/components/features/profile/blocks";
import type { CollectionBlockType, CollectionWithItems } from "@/types";

interface Props {
  collectionBlock: CollectionBlockType;
  index: number;
  collection: CollectionWithItems;
  onMove?: (dragIndex: number, hoverIndex: number) => void;
  onDelete?: (id: string) => void;
  onSave?: (block: Partial<CollectionBlockType>) => void;
}

export default function DraggableCollectionBlock({
  collectionBlock,
  index,
  collection,
  onMove,
  onDelete,
  onSave,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "COLLECTION",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => true,
  });

  const [{ isOver }, drop] = useDrop({
    accept: "COLLECTION",
    hover: (item: { index: number }) => {
      if (item.index === index) return;
      onMove?.(item.index, index);
      item.index = index;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    canDrop: () => true,
  });

  // Combine the refs
  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`relative ${isOver ? "ring-2 ring-blue-500 rounded-lg" : ""}`}
    >
      <CollectionBlock
        collection={collection}
        onDelete={
          onDelete ? () => onDelete(collectionBlock.collection_id!) : undefined
        }
        onSave={onSave}
      />
    </div>
  );
}
