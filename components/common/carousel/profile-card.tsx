"use client";

import Image from "next/image";
import { Profile } from "@/types";

interface ProfileCardProps {
  profile: Profile;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  // Generate a consistent random image based on the profile's handle
  const fallbackImage = `https://picsum.photos/seed/${profile.handle}/400/400`;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden transform transition-transform duration-200 hover:shadow-md">
      {/* Image Container */}
      <div className="relative w-full pb-[100%]">
        <Image
          src={profile.profile_picture_url || fallbackImage}
          alt={`${profile.first_name} ${profile.last_name}`}
          fill
          sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 25vw"
          className="object-cover"
          priority
        />
      </div>

      {/* Content Container */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="mb-3">
          <h3 className="text-lg font-semibold dark:text-white line-clamp-1">
            {profile.first_name} {profile.last_name}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            @{profile.handle}
          </p>
        </div>

        {profile.bio && (
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
            {profile.bio}
          </p>
        )}

        {profile.tags && profile.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {profile.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
            {profile.tags.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300">
                +{profile.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
