"use client";

import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import RCMDBlock from "../profile/blocks/rcmd-block";
import type { RCMDBlockType } from "@/types";

interface Props {
  rcmdBlock: RCMDBlockType;
  index: number;
  onMove?: (dragIndex: number, hoverIndex: number) => void;
  onDelete?: (id: string) => void;
  onSave?: (block: Partial<RCMDBlockType>) => void;
}

export default function DraggableRCMDBlock({
  rcmdBlock,
  index,
  onMove,
  onDelete,
  onSave,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "RCMD",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => true,
  });

  const [{ isOver }, drop] = useDrop({
    accept: "RCMD",
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
      <RCMDBlock
        rcmdBlock={rcmdBlock}
        onDelete={onDelete ? () => onDelete(rcmdBlock.id) : undefined}
        onSave={onSave}
      />
    </div>
  );
}
