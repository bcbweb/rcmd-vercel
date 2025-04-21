"use client";

import { useState, useEffect } from "react";
import type { RCMDBlockType } from "@/types";
import RCMDBlock from "../profile/blocks/rcmd-block";

interface Props {
  initialRCMDBlocks: RCMDBlockType[];
  onDelete?: (id: string) => void;
  onSave?: (block: Partial<RCMDBlockType>) => void;
}

export default function RCMDBlocks({
  initialRCMDBlocks = [],
  onDelete,
  onSave,
}: Props) {
  // Use state for tracking RCMD blocks
  const [rcmdBlocks, setRcmdBlocks] =
    useState<RCMDBlockType[]>(initialRCMDBlocks);

  // Update state when props change
  useEffect(() => {
    setRcmdBlocks(initialRCMDBlocks);
  }, [initialRCMDBlocks]);

  // Render empty state when no blocks
  if (rcmdBlocks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No RCMDs found
      </div>
    );
  }

  // Render blocks with edit capabilities
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rcmdBlocks.map((block) => (
          <RCMDBlock
            key={block.id}
            rcmdBlock={block}
            onDelete={onDelete ? () => onDelete(block.id) : undefined}
            onSave={onSave ? (updatedBlock) => onSave(updatedBlock) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
