import Image from 'next/image';
import { HeartIcon, BookmarkIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import { type RCMD } from '@/types';
import type { Database } from '@/types/supabase';
import { formatDistanceToNow } from 'date-fns';

type RcmdType = Database['public']['Enums']['rcmd_type'];

interface RCMDCardProps {
  rcmd: RCMD;
  onLike?: (id: string) => void;
  onSave?: (id: string) => void;
  onShare?: (id: string) => void;
}

export default function RCMDCard({ rcmd, onLike, onSave, onShare }: RCMDCardProps) {
  const getTypeIcon = (type: RcmdType) => {
    // const typeClasses = "w-5 h-5";
    switch (type) {
      case 'place':
        return "🏠";
      case 'product':
        return "🛍";
      case 'service':
        return "🔧";
      case 'experience':
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mx-4 overflow-hidden">
      {/* Image Section */}
      <div className="relative w-full aspect-video">
        <Image
          src={rcmd.featured_image || '/placeholder-image.jpg'}
          alt={rcmd.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          priority
        />
        {rcmd.is_sponsored && (
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-yellow-400 text-black rounded-full text-xs font-medium">
              Sponsored
            </span>
          </div>
        )}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="px-3 py-1 bg-black/50 text-white rounded-full text-sm">
            {getTypeIcon(rcmd.type)} {rcmd.type}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <h3 className="text-xl font-semibold dark:text-white mb-2">{rcmd.title}</h3>
        {rcmd.description && (
          <p className="text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
            {rcmd.description}
          </p>
        )}

        {/* Tags */}
        {rcmd.tags && rcmd.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {rcmd.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
            {rcmd.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300">
                +{rcmd.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats and Actions */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike?.(rcmd.id)}
              className="flex items-center gap-1 hover:text-red-500"
            >
              {rcmd.like_count ? <HeartIconSolid className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5" />}
              {rcmd.like_count || 0}
            </button>
            <button
              onClick={() => onSave?.(rcmd.id)}
              className="flex items-center gap-1 hover:text-blue-500"
            >
              {rcmd.save_count ? <BookmarkIconSolid className="w-5 h-5 text-blue-500" /> : <BookmarkIcon className="w-5 h-5" />}
              {rcmd.save_count || 0}
            </button>
            <button
              onClick={() => onShare?.(rcmd.id)}
              className="flex items-center gap-1 hover:text-green-500"
            >
              <ShareIcon className="w-5 h-5" />
              {rcmd.share_count || 0}
            </button>
          </div>
          {rcmd.created_at && (
            <span className="text-xs">
              {formatDistanceToNow(new Date(rcmd.created_at), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}