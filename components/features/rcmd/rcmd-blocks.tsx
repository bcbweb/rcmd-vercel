"use client";

import { useState, useEffect } from 'react';
import RCMDBlock from "../profile/blocks/rcmd-block";
import type { RCMDBlockType } from '@/types';

interface Props {
  initialRCMDBlocks?: RCMDBlockType[];
  onDelete?: (id: string) => void;
  onSave?: (block: Partial<RCMDBlockType>) => void;
}

export default function RCMDBlocks({
  initialRCMDBlocks = [],
  onDelete,
  onSave
}: Props) {
  const [rcmdBlocks, setRCMDBlocks] = useState<RCMDBlockType[]>(initialRCMDBlocks);

  useEffect(() => {
    setRCMDBlocks(initialRCMDBlocks);
  }, [initialRCMDBlocks]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rcmdBlocks.map((block) => (
          <RCMDBlock
            key={block.id}
            rcmdBlock={block}
            onDelete={() => onDelete?.(block.id)}
            onSave={onSave}
          />
        ))}
      </div>

      {rcmdBlocks.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No RCMDs found
        </div>
      )}
    </div>
  );
}