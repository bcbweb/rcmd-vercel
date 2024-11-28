import { useState } from 'react';
import {
  PencilLine,
  Eye,
  X,
  Check,
  MoreVertical,
  Share2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CoverImageUpload from "@/components/cover-image-upload";
import ProfilePhotoUpload from "@/components/profile-photo-upload";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { Profile } from '@/types';

interface ProfileHeaderProps {
  profileId: string,
  title: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  coverImageUrl?: string;
  showEditButton?: boolean;
  showPreviewButton?: boolean;
  showShareButton?: boolean;
  onUpdate?: () => void;
}

export default function ProfileHeader({
  profileId,
  title,
  username,
  firstName,
  lastName,
  profilePictureUrl,
  coverImageUrl,
  showEditButton = true,
  showPreviewButton = true,
  showShareButton = true,
  onUpdate
}: ProfileHeaderProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: firstName || '',
    lastName: lastName || ''
  });
  const [newCoverImageUrl, setNewCoverImageUrl] = useState(coverImageUrl);
  const [newProfilePictureUrl, setNewProfilePictureUrl] = useState(profilePictureUrl);

  const tabs = [
    { name: 'Profile', href: `/protected/profile` },
    { name: 'Links', href: `/protected/profile/links` },
    { name: 'RCMDs', href: `/protected/profile/rcmds` },
  ];

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const updates: Partial<Profile> = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        profile_picture_url: newProfilePictureUrl,
        cover_image: newCoverImageUrl
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('username', username);

      if (error) throw error;

      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: firstName || '',
      lastName: lastName || ''
    });
    setNewCoverImageUrl(coverImageUrl);
    setNewProfilePictureUrl(profilePictureUrl);
  };

  return (
    <div className="relative mb-8">
      {/* Cover Image */}
      {isEditing ? (
        <CoverImageUpload
          currentImageUrl={newCoverImageUrl} // Changed from coverImageUrl
          profileId={profileId}
          onUploadComplete={setNewCoverImageUrl}
        />
      ) : (
        <div className="relative w-full h-[350px] mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          {newCoverImageUrl ? (
            <Image
              src={newCoverImageUrl}
              alt="Cover image"
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
          )}
        </div>
      )}

      {/* Profile Info Container */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative flex items-end pb-4 border-b border-gray-200 dark:border-gray-700">
          {/* Profile Picture - Larger size and repositioned */}
          <div className="absolute -top-32 left-4">
            {isEditing ? (
              <div className="w-40 h-40">
                <ProfilePhotoUpload
                  onUploadComplete={setNewProfilePictureUrl}
                  currentPhotoUrl={newProfilePictureUrl}
                  profileId={profileId}
                />
              </div>
            ) : (
              <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                {newProfilePictureUrl ? (
                  <Image
                    src={newProfilePictureUrl}
                    alt="Profile picture"
                    fill
                    className="object-cover"
                    sizes="(max-width: 160px) 160px"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-4xl text-gray-500 dark:text-gray-400">
                      {formData.firstName?.charAt(0) || username.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Info and Actions */}
          <div className="ml-44 flex-grow flex items-end justify-between pb-4">
            {/* Name and Title */}
            <div>
              <h1 className="text-3xl font-bold dark:text-white mb-1">
                {fullName || username}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{title}</p>
            </div>

            {/* Action Buttons */}
            <div className="relative">
              {/* Mobile Dropdown */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isEditing ? (
                      <>
                        <DropdownMenuItem onClick={handleCancel}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSave} disabled={isLoading}>
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        {showEditButton && (
                          <DropdownMenuItem onClick={() => setIsEditing(true)}>
                            <PencilLine className="w-4 h-4 mr-2" />
                            Edit Profile
                          </DropdownMenuItem>
                        )}
                        {showPreviewButton && (
                          <DropdownMenuItem onClick={() => window.open(`/${username}`, '_blank')}>
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                        )}
                        {showShareButton && (
                          <DropdownMenuItem>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop Buttons */}
              <div className="hidden md:flex items-center gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                      disabled={isLoading}
                    >
                      <X className="w-5 h-5 inline-block mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                      disabled={isLoading}
                    >
                      <Check className="w-5 h-5 inline-block mr-2" />
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    {showEditButton && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                      >
                        <PencilLine className="w-5 h-5 inline-block mr-2" />
                      </button>
                    )}
                    {showPreviewButton && (
                      <button
                        onClick={() => window.open(`/${username}`, '_blank')}
                        className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Eye className="w-5 h-5 inline-block mr-2" />
                      </button>
                    )}
                    {showShareButton && (
                      <button
                        onClick={() => window.open(`/${username}`, '_blank')}
                        className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Share2 className="w-5 h-5 inline-block mr-2" />
                      </button>)}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-4">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'}
                  `}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div >
    </div >
  );
}
