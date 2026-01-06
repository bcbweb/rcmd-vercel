"use client";

import { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { RCMDBlockType } from "@/types";
import DraggableRCMDBlock from "./draggable-rcmd-block";

interface Props {
  initialRCMDBlocks: RCMDBlockType[];
  onDelete?: (id: string) => void;
  onSave?: (block: Partial<RCMDBlockType>) => void;
  onMove?: (dragIndex: number, hoverIndex: number) => void;
}

export default function RCMDBlocks({
  initialRCMDBlocks = [],
  onDelete,
  onSave,
  onMove,
}: Props) {
  // Use state for tracking RCMD blocks
  const [rcmdBlocks, setRcmdBlocks] =
    useState<RCMDBlockType[]>(initialRCMDBlocks);

  // Update state when props change
  useEffect(() => {
    setRcmdBlocks(initialRCMDBlocks);
  }, [initialRCMDBlocks]);

  // Handle move locally for immediate UI feedback
  const handleMove = (dragIndex: number, hoverIndex: number) => {
    setRcmdBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      const [removed] = newBlocks.splice(dragIndex, 1);
      newBlocks.splice(hoverIndex, 0, removed);
      return newBlocks;
    });
    // Call parent's onMove to persist the change
    onMove?.(dragIndex, hoverIndex);
  };

  // Render empty state when no blocks
  if (rcmdBlocks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No RCMDs found
      </div>
    );
  }

  // Render blocks with edit capabilities and drag and drop
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rcmdBlocks.map((block, index) => (
            <DraggableRCMDBlock
              key={block.id}
              rcmdBlock={block}
              index={index}
              onMove={handleMove}
              onDelete={onDelete ? () => onDelete(block.id) : undefined}
              onSave={
                onSave ? (updatedBlock) => onSave(updatedBlock) : undefined
              }
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
}
