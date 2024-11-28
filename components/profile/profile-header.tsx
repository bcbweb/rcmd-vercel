import { useState } from 'react';
import {
  PencilLine,
  Eye,
  X,
  Check,
  Share2
} from 'lucide-react';
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
  handle: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  coverImageUrl?: string;
  interests?: string[] | null;
  tags?: string[] | null;
  bio?: string;
  location?: string;
  showEditButton?: boolean;
  showPreviewButton?: boolean;
  showShareButton?: boolean;
  onUpdate?: () => void;
}

export default function ProfileHeader({
  profileId,
  title,
  handle,
  firstName,
  lastName,
  profilePictureUrl,
  coverImageUrl,
  interests = [],
  tags = [],
  bio = '',
  location = '',
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
    lastName: lastName || '',
    bio: bio || '',
    interests: interests || [],
    tags: tags || []
  });
  const [newCoverImageUrl, setNewCoverImageUrl] = useState(coverImageUrl);
  const [newProfilePictureUrl, setNewProfilePictureUrl] = useState(profilePictureUrl);
  const [newInterest, setNewInterest] = useState('');
  const [newTag, setNewTag] = useState('');

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
        bio: formData.bio,
        interests: formData.interests,
        tags: formData.tags,
        profile_picture_url: newProfilePictureUrl,
        cover_image: newCoverImageUrl
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('handle', handle);

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
      lastName: lastName || '',
      bio: bio || '',
      interests: interests || [],
      tags: tags || []
    });
    setNewCoverImageUrl(coverImageUrl);
    setNewProfilePictureUrl(profilePictureUrl);
    setNewInterest('');
    setNewTag('');
  };

  const handleAddInterest = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newInterest.trim()) {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interestToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(interest => interest !== interestToRemove)
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="relative mb-8">
      {/* Cover Image */}
      <div className="relative w-full h-[250px] md:h-[350px] mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        {isEditing ? (
          <CoverImageUpload
            currentImageUrl={newCoverImageUrl}
            profileId={profileId}
            onUploadComplete={setNewCoverImageUrl}
          />
        ) : (
          newCoverImageUrl ? (
            <Image
              src={newCoverImageUrl}
              alt="Cover image"
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
          )
        )}
      </div>

      {/* Profile Info Container */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative flex flex-col md:flex-row md:items-end pb-4 border-b border-gray-200 dark:border-gray-700">
          {/* Profile Picture */}
          <div className="flex justify-center md:justify-start md:absolute md:-top-32 md:left-4 mb-4 md:mb-0">
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
                      {formData.firstName?.charAt(0) || handle.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Info and Actions */}
          <div className="w-full md:ml-44 flex-grow flex flex-col md:flex-row md:items-end justify-between pb-4">
            {/* Profile info */}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold dark:text-white mb-1">
                {fullName || handle}
              </h1>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                <span>@{handle}</span>
                {location && (
                  <>
                    <span>·</span>
                    <span>📍 {location}</span>
                  </>
                )}
              </div>

              {/* Bio */}
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full p-2 mb-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="Add your bio"
                  rows={3}
                />
              ) : bio && (
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {bio}
                </p>
              )}

              {/* Interests */}
              <div className="mb-2">
                {isEditing && (
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={handleAddInterest}
                    className="w-full p-2 mb-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                    placeholder="Add interest (press Enter)"
                  />
                )}
                {formData.interests && formData.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full flex items-center gap-1"
                      >
                        {interest}
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveInterest(interest)}
                            className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                {isEditing && (
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="w-full p-2 mb-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                    placeholder="Add tag (press Enter)"
                  />
                )}
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-full flex items-center gap-1"
                      >
                        #{tag}
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 md:mt-0 flex justify-center md:justify-end">
              <div className="flex items-center gap-3">
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
                        onClick={() => window.open(`/${handle}`, '_blank')}
                        className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Eye className="w-5 h-5 inline-block mr-2" />
                      </button>
                    )}
                    {showShareButton && (
                      <button
                        onClick={() => window.open(`/${handle}`, '_blank')}
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
        <div className="mt-4 overflow-x-auto">
          <nav className="flex space-x-8 min-w-max">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  aria-label={title}
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
      </div>
    </div>
  );
}
