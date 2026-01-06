"use client";

import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import LinkBlock from "../profile/blocks/link-block";
import type { LinkBlockType } from "@/types";

interface Props {
  linkBlock: LinkBlockType;
  index: number;
  onMove?: (dragIndex: number, hoverIndex: number) => void;
  onDelete?: (id: string) => void;
  onSave?: (block: Partial<LinkBlockType>) => void;
}

export default function DraggableLinkBlock({
  linkBlock,
  index,
  onMove,
  onDelete,
  onSave,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "LINK",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => true,
  });

  const [{ isOver }, drop] = useDrop({
    accept: "LINK",
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
      <LinkBlock
        linkBlock={linkBlock}
        onDelete={onDelete ? () => onDelete(linkBlock.id) : undefined}
        onSave={onSave}
      />
    </div>
  );
}

