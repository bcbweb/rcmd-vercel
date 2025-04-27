"use client";

import Image from "next/image";
import NextLink from "next/link";
import {
  Heart,
  Bookmark,
  Share2,
  MapPin,
  Link as LinkIcon,
  DollarSign,
  Eye,
} from "lucide-react";
import type { RCMD, RCMDType } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { getRCMDShortLink } from "@/components/features/rcmd/rcmd-link";

interface RCMDCardProps {
  rcmd: RCMD;
  onLike?: (id: string) => void;
  onSave?: (id: string) => void;
  onShare?: (id: string) => void;
  onView?: (id: string) => void;
}

export default function RCMDCard({
  rcmd,
  onLike,
  onSave,
  onShare,
  onView,
}: RCMDCardProps) {
  // Get the short URL for this RCMD
  const shortLink = getRCMDShortLink(rcmd.id);

  // Handle view action
  const handleView = (e: React.MouseEvent) => {
    if (onView) {
      e.preventDefault();
      onView(rcmd.id);
    }
  };

  const getTypeIcon = (type: RCMDType) => {
    switch (type) {
      case "other":
        return "👽";
      case "place":
        return "🏠";
      case "product":
        return "🛍";
      case "service":
        return "🔧";
      case "experience":
        return "🎯";
      default:
        return "📌";
    }
  };

  const formatLocation = (location: unknown): string | null => {
    if (!location) return null;

    if (typeof location === "string") {
      try {
        const parsed = JSON.parse(location);
        return formatLocation(parsed);
      } catch {
        // If parsing fails, return the raw string
        return location;
      }
    }

    if (
      typeof location === "object" &&
      location !== null &&
      "address" in location &&
      typeof location.address === "string"
    ) {
      return location.address;
    }

    if (
      typeof location === "object" &&
      location !== null &&
      "city" in location &&
      typeof location.city === "string"
    ) {
      if ("state" in location && typeof location.state === "string") {
        return `${location.city}, ${location.state}`;
      }
      return location.city;
    }

    return typeof location === "object" && location !== null
      ? Object.values(location).filter(Boolean).join(", ")
      : String(location);
  };

  const formatPriceRange = (priceRange: unknown): string | null => {
    if (!priceRange) return null;

    if (typeof priceRange === "string") {
      // For strings like "$" or "$$" directly
      if (/^(\$+)$/.test(priceRange)) {
        return priceRange;
      }

      // For numeric strings
      if (/^\d+$/.test(priceRange)) {
        return "$".repeat(Math.min(parseInt(priceRange, 10), 4));
      }

      // Try to parse JSON
      try {
        const parsed = JSON.parse(priceRange);
        return formatPriceRange(parsed);
      } catch {
        return priceRange;
      }
    }

    if (typeof priceRange === "number") {
      return "$".repeat(Math.min(priceRange, 4));
    }

    return typeof priceRange === "object" && priceRange !== null
      ? JSON.stringify(priceRange)
      : String(priceRange);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden transform transition-transform duration-200 hover:shadow-md">
      {/* Image Section */}
      <NextLink href={shortLink} onClick={handleView}>
        <div className="relative w-full aspect-video cursor-pointer">
          <Image
            src={rcmd.featured_image || "/images/default-image.jpg"}
            alt={rcmd.title}
            fill
            sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 30vw"
            className="object-cover"
            priority
            onError={(e) => {
              // Fallback to default image on error
              const imgElement = e.currentTarget as HTMLImageElement;
              imgElement.src = "/images/default-image.jpg";
              console.log("Image load error, using fallback for:", rcmd.id);
            }}
          />

          {rcmd.is_sponsored && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 bg-yellow-400 text-black rounded-full text-xs font-medium">
                Sponsored
              </span>
            </div>
          )}

          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white rounded-full text-xs">
              {getTypeIcon(rcmd.type)} {rcmd.type}
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex items-center text-white gap-2">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-xs">{rcmd.view_count || 0} views</span>
            </div>
          </div>
        </div>
      </NextLink>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        <NextLink
          href={shortLink}
          className="hover:underline"
          onClick={handleView}
        >
          <h3 className="text-lg font-semibold dark:text-white mb-1.5 line-clamp-1">
            {rcmd.title}
          </h3>
        </NextLink>

        {/* Location - Displayed below title */}
        {rcmd.location && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {formatLocation(rcmd.location)}
            </span>
          </div>
        )}

        {/* URL, if available */}
        {rcmd.url && (
          <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mb-2">
            <span className="flex items-center gap-1.5 truncate hover:underline">
              <LinkIcon className="w-3.5 h-3.5" />
              <a
                href={rcmd.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {rcmd.url.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            </span>
          </div>
        )}

        {/* Price Range */}
        {rcmd.price_range && formatPriceRange(rcmd.price_range) && (
          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-2">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              {formatPriceRange(rcmd.price_range)}
            </span>
          </div>
        )}

        {/* Description */}
        {rcmd.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
            {rcmd.description}
          </p>
        )}

        {/* Tags - Improved visibility */}
        {rcmd.tags && Array.isArray(rcmd.tags) && rcmd.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3 mt-auto">
            {rcmd.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
            {rcmd.tags.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300">
                +{rcmd.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats and Actions */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
          {/* Stats */}
          <div className="flex items-center">
            <span>
              {formatDistanceToNow(new Date(rcmd.created_at || Date.now()), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike?.(rcmd.id);
              }}
              className="p-1 hover:text-red-500"
              aria-label="Like"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave?.(rcmd.id);
              }}
              className="p-1 hover:text-blue-500"
              aria-label="Save"
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare?.(rcmd.id);
              }}
              className="p-1 hover:text-green-500"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
