"use client";

import { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import PublicLinkBlocks from "@/components/features/links/public-link-blocks";
import DraggableLinkBlock from "./draggable-link-block";
import type { LinkBlockType, Link } from "@/types";

interface Props {
  initialLinkBlocks?: LinkBlockType[];
  links?: Link[];
  onDelete?: (id: string) => void;
  onSave?: (block: Partial<LinkBlockType>) => void;
  onMove?: (dragIndex: number, hoverIndex: number) => void;
  isPublic?: boolean;
}

export default function LinkBlocks({
  initialLinkBlocks = [],
  links = [],
  onDelete,
  onSave,
  onMove,
  isPublic = false,
}: Props) {
  const [linkBlocks, setLinkBlocks] =
    useState<LinkBlockType[]>(initialLinkBlocks);

  useEffect(() => {
    setLinkBlocks(initialLinkBlocks);
  }, [initialLinkBlocks]);

  // Handle move locally for immediate UI feedback
  const handleMove = (dragIndex: number, hoverIndex: number) => {
    setLinkBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      const [removed] = newBlocks.splice(dragIndex, 1);
      newBlocks.splice(hoverIndex, 0, removed);
      return newBlocks;
    });
    // Call parent's onMove to persist the change
    onMove?.(dragIndex, hoverIndex);
  };

  const renderRegularBlocks = () => {
    return (
      <DndProvider backend={HTML5Backend}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {linkBlocks.map((block, index) => (
            <DraggableLinkBlock
              key={block.id}
              linkBlock={block}
              index={index}
              onMove={handleMove}
              onDelete={onDelete ? () => onDelete(block.id) : undefined}
              onSave={onSave}
            />
          ))}
        </div>
      </DndProvider>
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
