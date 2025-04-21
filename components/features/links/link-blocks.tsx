"use client";

import { useState, useEffect } from "react";
import { LinkBlock } from "@/components/features/profile/blocks";
import PublicLinkBlocks from "@/components/features/links/public-link-blocks";
import type { LinkBlockType, Link } from "@/types";

interface Props {
  initialLinkBlocks?: LinkBlockType[];
  links?: Link[];
  onDelete?: (id: string) => void;
  onSave?: (block: Partial<LinkBlockType>) => void;
  isPublic?: boolean;
}

export default function LinkBlocks({
  initialLinkBlocks = [],
  links = [],
  onDelete,
  onSave,
  isPublic = false,
}: Props) {
  const [linkBlocks, setLinkBlocks] =
    useState<LinkBlockType[]>(initialLinkBlocks);

  useEffect(() => {
    setLinkBlocks(initialLinkBlocks);
  }, [initialLinkBlocks]);

  const renderRegularBlocks = () => {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {linkBlocks.map((block) => (
          <LinkBlock
            key={block.id}
            linkBlock={block}
            onDelete={onDelete ? () => onDelete(block.id) : undefined}
            onSave={onSave}
          />
        ))}
      </div>
    );
  };

  const renderEmptyState = () => {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No links found
      </div>
    );
  };

  if (isPublic && links.length > 0) {
    return <PublicLinkBlocks links={links} />;
  }

  return (
    <div className="space-y-4">
      {linkBlocks.length > 0 ? renderRegularBlocks() : renderEmptyState()}
    </div>
  );
}
