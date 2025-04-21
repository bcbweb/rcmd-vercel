"use client";

import type { Link } from "@/types";
import { ExternalLink, Calendar } from "lucide-react";
import { formatDistance } from "date-fns";

interface Props {
  links: Link[];
}

export default function PublicLinkBlocks({ links }: Props) {
  // Early return if no links
  if (!links || links.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No links found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
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

                {link.type && link.type !== "other" && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                    {link.type}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
