"use client";

import { useState, useEffect } from "react";
import { LinkBlock } from "@/components/features/profile/blocks";
import type { LinkBlockType, Link } from "@/types";
import { Calendar, ExternalLink } from "lucide-react";
import { formatDistance } from "date-fns";

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

  const renderLink = (link: Link) => {
    return (
      <div
        key={link.id}
        className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200"
      >
        <div className="p-4">
          <h3 className="text-lg font-medium line-clamp-1 mb-2">
            {link.title}
          </h3>

          {link.description && (
            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
              {link.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
            {link.url && (
              <div className="flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 truncate max-w-[150px]"
                >
                  {link.url.startsWith("http")
                    ? new URL(link.url).hostname
                    : link.url}
                </a>
              </div>
            )}

            {link.created_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDistance(new Date(link.created_at), new Date(), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map(renderLink)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {linkBlocks.length > 0 ? renderRegularBlocks() : renderEmptyState()}
    </div>
  );
}
