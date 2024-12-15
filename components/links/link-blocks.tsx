"use client";

import { useState, useEffect } from 'react';
import LinkBlock from '../profile/blocks/link-block';
import type { LinkBlockType } from '@/types';

interface Props {
  initialLinkBlocks?: LinkBlockType[];
  onDelete?: (id: string) => void;
  onSave?: (block: Partial<LinkBlockType>) => void;
}

export default function LinkBlocks({
  initialLinkBlocks = [],
  onDelete,
  onSave
}: Props) {
  const [linkBlocks, setLinkBlocks] = useState<LinkBlockType[]>(initialLinkBlocks);

  useEffect(() => {
    setLinkBlocks(initialLinkBlocks);
  }, [initialLinkBlocks]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {linkBlocks.map((block) => (
          <LinkBlock
            key={block.id}
            linkBlock={block}
            onDelete={() => onDelete?.(block.id)}
            onSave={onSave}
          />
        ))}
      </div>

      {linkBlocks.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No links found
        </div>
      )}
    </div>
  );
}