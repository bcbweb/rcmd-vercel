"use client";

import React from "react";
import Link from "next/link";
import { formatDistance } from "date-fns";
import {
  MapPin,
  Clock,
  User,
  ExternalLink,
  Heart,
  BookmarkPlus,
  Share2,
} from "lucide-react";
import { RCMD } from "@/types";
import { MetadataPreviewImage } from "@/components/common/MetadataPreviewImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

interface RCMDDetailProps {
  rcmd: RCMD;
}

export function RCMDDetail({ rcmd }: RCMDDetailProps) {
  // Format the date
  const formattedDate = rcmd.created_at
    ? formatDistance(new Date(rcmd.created_at), new Date(), { addSuffix: true })
    : "";

  // Format location if available (check if these fields exist)
  const location = rcmd.location ? rcmd.location : "";

  // Format price range if available
  const priceRange =
    rcmd.price_range && typeof rcmd.price_range === "string"
      ? "$".repeat(parseInt(rcmd.price_range))
      : "";

  return (
    <Card className="overflow-hidden">
      {rcmd.featured_image && (
        <div className="relative h-64 w-full">
          <MetadataPreviewImage
            src={rcmd.featured_image}
            alt={rcmd.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold mb-2">
              {rcmd.title}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mb-3">
              {rcmd.type && (
                <Badge variant="outline" className="capitalize">
                  {rcmd.type}
                </Badge>
              )}
              {priceRange && (
                <Badge variant="outline" className="font-mono">
                  {priceRange}
                </Badge>
              )}
              {rcmd.tags &&
                Array.isArray(rcmd.tags) &&
                rcmd.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
            </div>
          </div>

          {rcmd.external_url && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={rcmd.external_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {rcmd.description && (
          <div className="mb-6 text-gray-700 dark:text-gray-300">
            <p>{rcmd.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {location && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{location}</span>
            </div>
          )}

          {formattedDate && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4 mr-2" />
              <span>Added {formattedDate}</span>
            </div>
          )}

          {rcmd.profiles && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <User className="h-4 w-4 mr-2" />
              <Link
                href={`/${rcmd.profiles.handle}`}
                className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
              >
                {rcmd.profiles.display_name || rcmd.profiles.handle}
              </Link>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">
            <Heart className="h-4 w-4 mr-2" />
            <span>Like</span>
          </Button>
          <Button variant="ghost" size="sm">
            <BookmarkPlus className="h-4 w-4 mr-2" />
            <span>Save</span>
          </Button>
        </div>
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          <span>Share</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
