"use client";

import Image from "next/image";
import {
  Heart,
  Bookmark,
  Share2,
  MapPin,
  Link,
  DollarSign,
  Clock,
  Eye,
} from "lucide-react";

import type { RCMD, RCMDType } from "@/types";
import { formatDistanceToNow } from "date-fns";

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
  const getTypeIcon = (type: RCMDType) => {
    // const typeClasses = "w-5 h-5";
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
      try {
        const parsed = JSON.parse(priceRange);
        return formatPriceRange(parsed);
      } catch {
        // If parsing fails, return the raw string
        return priceRange;
      }
    }

    if (typeof priceRange === "object" && priceRange !== null) {
      const pr = priceRange as Record<string, unknown>;
      const currency = "currency" in pr ? String(pr.currency || "$") : "$";

      if ("min" in pr && "max" in pr && pr.min && pr.max) {
        return `${currency}${pr.min} - ${currency}${pr.max}`;
      } else if ("min" in pr && pr.min) {
        return `From ${currency}${pr.min}`;
      } else if ("max" in pr && pr.max) {
        return `Up to ${currency}${pr.max}`;
      }
    }

    return null;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden transform transition-transform duration-200 hover:shadow-md">
      {/* Image Section */}
      <div
        className="relative w-full aspect-video cursor-pointer"
        onClick={() => onView?.(rcmd.id)}
      >
        <Image
          src={rcmd.featured_image || "/placeholder-image.jpg"}
          alt={rcmd.title}
          fill
          sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 30vw"
          className="object-cover"
          priority
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

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold dark:text-white mb-1.5 line-clamp-1">
          {rcmd.title}
        </h3>

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
              <Link className="w-3.5 h-3.5" />
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
        {rcmd.tags && rcmd.tags.length > 0 && (
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
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike?.(rcmd.id);
              }}
              className="flex items-center gap-1 hover:text-red-500"
            >
              <Heart
                className="w-4 h-4"
                fill={rcmd.like_count ? "#000000" : "none"}
                color={rcmd.like_count ? "#ef4444" : "currentColor"}
              />
              {rcmd.like_count || 0}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave?.(rcmd.id);
              }}
              className="flex items-center gap-1 hover:text-blue-500"
            >
              <Bookmark
                className="w-4 h-4"
                fill={rcmd.save_count ? "#000000" : "none"}
                color={rcmd.save_count ? "#3b82f6" : "currentColor"}
              />
              {rcmd.save_count || 0}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare?.(rcmd.id);
              }}
              className="flex items-center gap-1 hover:text-green-500"
            >
              <Share2 className="w-4 h-4" />
              {rcmd.share_count || 0}
            </button>
          </div>
          {rcmd.created_at && (
            <span className="flex items-center gap-1 text-xs">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(rcmd.created_at), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
