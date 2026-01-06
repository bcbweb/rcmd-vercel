"use client";

import { useState, useEffect } from "react";
import type { ProfileBlockType } from "@/types";
import DraggableBlock from "./draggable-block";

interface Props {
  blocks: ProfileBlockType[];
  onMove?: (dragIndex: number, hoverIndex: number) => void;
  onDelete?: (id: string) => void;
  onSave?: (updatedBlock: ProfileBlockType) => void;
}

export default function ProfileBlocks({
  blocks,
  onMove,
  onDelete,
  onSave,
}: Props) {
  // Use state for tracking blocks to enable immediate UI feedback
  const [localBlocks, setLocalBlocks] = useState<ProfileBlockType[]>(blocks);

  // Update state when props change
  useEffect(() => {
    setLocalBlocks(blocks);
  }, [blocks]);

  // Handle move locally for immediate UI feedback
  const handleMove = (dragIndex: number, hoverIndex: number) => {
    setLocalBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      const [removed] = newBlocks.splice(dragIndex, 1);
      newBlocks.splice(hoverIndex, 0, removed);
      return newBlocks;
    });
    // Call parent's onMove to persist the change
    onMove?.(dragIndex, hoverIndex);
  };

  // Handle block save - refresh the block in local state
  const handleBlockSave = (updatedBlock: ProfileBlockType) => {
    setLocalBlocks((prevBlocks) =>
      prevBlocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b))
    );
    // Call parent's onSave if provided
    onSave?.(updatedBlock);
  };

  return (
    <div className="space-y-4">
      {localBlocks.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No blocks found
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {localBlocks.map((block, index) => (
          <DraggableBlock
            key={block.id}
            block={block}
            index={index}
            onMove={handleMove}
            onDelete={() => onDelete?.(block.id)}
            onSave={handleBlockSave}
          />
        ))}
      </div>
    </div>
  );
}
