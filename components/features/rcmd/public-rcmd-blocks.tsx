"use client";

import type { RCMD } from "@/types";
import Image from "next/image";
import { MapPin, Link as LinkIcon, Calendar } from "lucide-react";
import { formatDistance } from "date-fns";
import { RCMDLink } from "./rcmd-link";

interface Props {
  rcmds: RCMD[];
}

export default function PublicRCMDBlocks({ rcmds }: Props) {
  // Early return if no RCMDs
  if (!rcmds || rcmds.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-2">No recommendations found</h2>
        <p className="text-muted-foreground">
          No public recommendations have been shared yet. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rcmds.map((rcmd) => (
          <div
            key={rcmd.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            {rcmd.featured_image && (
              <div className="w-full aspect-video relative">
                <RCMDLink rcmd={rcmd}>
                  <Image
                    src={rcmd.featured_image}
                    alt={rcmd.title || "RCMD Image"}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </RCMDLink>
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-medium line-clamp-1 mb-2">
                <RCMDLink rcmd={rcmd} className="hover:underline">
                  {rcmd.title}
                </RCMDLink>
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
                      {typeof rcmd.location === "object" &&
                      rcmd.location !== null
                        ? (rcmd.location as { address?: string }).address ||
                          JSON.stringify(rcmd.location)
                        : String(rcmd.location)}
                    </span>
                  </div>
                )}

                {rcmd.url && (
                  <div className="flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
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
        ))}
      </div>
    </div>
  );
}
