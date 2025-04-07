"use client";

import Image from "next/image";
import { Heart, Bookmark, Share2, MapPin } from "lucide-react";

import type { RCMD, RCMDType } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface RCMDCardProps {
  rcmd: RCMD;
  onLike?: (id: string) => void;
  onSave?: (id: string) => void;
  onShare?: (id: string) => void;
}

export default function RCMDCard({
  rcmd,
  onLike,
  onSave,
  onShare,
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

  // const formatPriceRange = (range: JSON | null) => {
  //   if (!range) return 'Price not available';
  //   // Implement based on your price_range structure
  //   return 'Price range placeholder';
  // };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden transform transition-transform duration-200 hover:shadow-md">
      {/* Image Section */}
      <div className="relative w-full aspect-video">
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
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold dark:text-white mb-2 line-clamp-1">
          {rcmd.title}
        </h3>

        {/* Location - Displayed below title */}
        {rcmd.location && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />{" "}
              {String(rcmd.location).includes("address")
                ? JSON.parse(String(rcmd.location)).address
                : String(rcmd.location)}
            </span>
          </div>
        )}

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
                +{rcmd.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats and Actions */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onLike?.(rcmd.id)}
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
              onClick={() => onSave?.(rcmd.id)}
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
              onClick={() => onShare?.(rcmd.id)}
              className="flex items-center gap-1 hover:text-green-500"
            >
              <Share2 className="w-4 h-4" />
              {rcmd.share_count || 0}
            </button>
          </div>
          {rcmd.created_at && (
            <span className="text-xs">
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
