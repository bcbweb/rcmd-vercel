"use client";

import { useState, useEffect } from "react";
import type { RCMD, RCMDBlockType } from "@/types";
import Image from "next/image";
import { MapPin, Link, Calendar } from "lucide-react";
import { formatDistance } from "date-fns";
import RCMDBlock from "../profile/blocks/rcmd-block";

interface Props {
  initialRCMDBlocks?: RCMDBlockType[];
  rcmds?: RCMD[]; // New prop to accept direct RCMD entities
  onDelete?: (id: string) => void;
  onSave?: (block: Partial<RCMDBlockType>) => void;
  isPublic?: boolean; // Flag to indicate if this is for the public view
}

export default function RCMDBlocks({
  initialRCMDBlocks = [],
  rcmds = [],
  onDelete,
  onSave,
  isPublic = false,
}: Props) {
  const [rcmdBlocks, setRCMDBlocks] =
    useState<RCMDBlockType[]>(initialRCMDBlocks);

  useEffect(() => {
    setRCMDBlocks(initialRCMDBlocks);
  }, [initialRCMDBlocks]);

  // For direct rendering of RCMDs in public pages
  const renderRCMD = (rcmd: RCMD) => {
    return (
      <div
        key={rcmd.id}
        className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200"
      >
        {rcmd.featured_image && (
          <div className="w-full aspect-video relative">
            <Image
              src={rcmd.featured_image}
              alt={rcmd.title || "RCMD Image"}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="p-4">
          <h3 className="text-lg font-medium line-clamp-1 mb-2">
            {rcmd.title}
          </h3>

          {rcmd.description && (
            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
              {rcmd.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
            {rcmd.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[150px]">
                  {typeof rcmd.location === "object" && rcmd.location !== null
                    ? (rcmd.location as any).address ||
                      JSON.stringify(rcmd.location)
                    : String(rcmd.location)}
                </span>
              </div>
            )}

            {rcmd.url && (
              <div className="flex items-center gap-1">
                <Link className="h-3 w-3" />
                <a
                  href={rcmd.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 truncate max-w-[150px]"
                >
                  {new URL(rcmd.url).hostname}
                </a>
              </div>
            )}

            {rcmd.created_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDistance(new Date(rcmd.created_at), new Date(), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            )}
          </div>

          {rcmd.tags && rcmd.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {rcmd.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render regular RCMD blocks (for admin/editing views)
  const renderRegularBlocks = () => {
    return (
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
    );
  };

  // Show empty state when nothing to display
  const renderEmptyState = () => {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No RCMDs found
      </div>
    );
  };

  // For public ISR pages, render the direct RCMD entities
  if (isPublic && rcmds.length > 0) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rcmds.map(renderRCMD)}
        </div>
      </div>
    );
  }

  // For admin/editing views, render the blocks
  return (
    <div className="space-y-4">
      {rcmdBlocks.length > 0 ? renderRegularBlocks() : renderEmptyState()}
    </div>
  );
}
