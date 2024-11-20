'use client';

import Image from 'next/image';
import { Profile } from '@/types';

interface ProfileCardProps {
  profile: Profile;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  // Generate a consistent random image based on the profile's handle
  const fallbackImage = `https://picsum.photos/seed/${profile.handle}/400/400`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mx-4 overflow-hidden">
      {/* Image Container */}
      <div className="relative w-full aspect-square">
        <Image
          src={profile.profile_picture_url || fallbackImage}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          priority
        />
      </div>

      {/* Content Container */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold dark:text-white">{profile.first_name}{" "}{profile.last_name}</h3>
            <p className="text-gray-500 dark:text-gray-400">@{profile.handle}</p>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
          {profile.bio}
        </p>

        <div className="flex flex-wrap gap-2">
          {profile.tags?.map(tag => (
            <span
              key={tag}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}