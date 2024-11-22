'use client';

import { Json } from '@/types/supabase';
import { Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    cover_photo_url: string | null;
    rating_avg: number | null;
    rating_count: number | null;
    primary_location: Json;
    categories: string[] | null;
    type: string;
  };
}

export default function BusinessCard({ business }: BusinessCardProps) {
  return (
    <Link
      href={`/business/${business.slug}`}
      className="block w-[300px] min-w-[300px] mx-2 overflow-hidden rounded-lg bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-lg dark:bg-gray-800"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={business.cover_photo_url || '/default-business-cover.jpg'}
          alt={business.name}
          fill
          className="object-cover"
        />
        {business.logo_url && (
          <div className="absolute bottom-4 left-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white bg-white">
              <Image
                src={business.logo_url}
                alt={`${business.name} logo`}
                width={64}
                height={64}
                className="h-full w-full object-cover"
                unoptimized={business.logo_url.includes('dicebear')} // Add this line
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
          {business.name}
        </h3>

        <div className="mb-2 flex items-center gap-2">
          {business.rating_avg && (
            <div className="flex items-center">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">
                {business.rating_avg.toFixed(1)} ({business.rating_count})
              </span>
            </div>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">•</span>
          <span className="text-sm text-gray-600 capitalize dark:text-gray-300">
            {business.type.toLowerCase().replace('_', ' ')}
          </span>
        </div>

        {business.description && (
          <p className="mb-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
            {business.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {business.categories?.slice(0, 3).map((category) => (
            <span
              key={category}
              className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            >
              {category}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}