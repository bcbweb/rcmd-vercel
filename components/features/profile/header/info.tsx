import { X, Share2, Edit2, Save, XCircle } from 'lucide-react';
import { SocialLinks } from './social-links';
import { Button } from '@/components/ui/button';

interface ProfileInfoProps {
  isEditing: boolean;
  isOwnProfile: boolean;
  formData: {
    firstName: string;
    lastName: string;
    bio: string;
    interests: string[];
    tags: string[];
  };
  handle: string;
  location?: string;
  socialLinks?: Array<{ platform: string; handle: string; }>;
  onFormChange: (field: string, value: string | number | boolean) => void;
  newInterest: string;
  onNewInterestChange: (value: string) => void;
  onAddInterest: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemoveInterest: (interest: string) => void;
  newTag: string;
  onNewTagChange: (value: string) => void;
  onAddTag: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemoveTag: (tag: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onShare: () => void;
}

export function ProfileInfo({
  isEditing,
  isOwnProfile,
  formData,
  handle,
  location,
  socialLinks,
  onFormChange,
  newInterest,
  onNewInterestChange,
  onAddInterest,
  onRemoveInterest,
  newTag,
  onNewTagChange,
  onAddTag,
  onRemoveTag,
  onEdit,
  onSave,
  onCancel,
  onShare
}: ProfileInfoProps) {
  const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ');

  return (
    <div className="w-full flex flex-col md:flex-row justify-between gap-4">
      {/* Left section with profile info */}
      <div className="flex-grow space-y-4">
        {/* Name and Handle */}
        <div>
          {isEditing ? (
            <div className="flex flex-col gap-2 mb-2">
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => onFormChange('firstName', e.target.value)}
                placeholder="First name"
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-lg"
              />
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => onFormChange('lastName', e.target.value)}
                placeholder="Last name"
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-lg"
              />
            </div>
          ) : (
            <h1 className="text-2xl font-bold dark:text-white">
              {fullName || handle}
            </h1>
          )}
          <p className="text-gray-500 dark:text-gray-400">@{handle}</p>
          {location && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              📍 {location}
            </p>
          )}
        </div>

        {/* Bio */}
        <div>
          {isEditing ? (
            <textarea
              value={formData.bio}
              onChange={(e) => onFormChange('bio', e.target.value)}
              placeholder="Write a bio..."
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md"
            />
          ) : formData.bio ? (
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {formData.bio}
            </p>
          ) : null}
        </div>

        {/* Interests */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {formData.interests.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              >
                {interest}
                {isEditing && (
                  <button
                    onClick={() => onRemoveInterest(interest)}
                    className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
            {isEditing && (
              <input
                type="text"
                value={newInterest}
                onChange={(e) => onNewInterestChange(e.target.value)}
                onKeyDown={onAddInterest}
                placeholder="Add interest..."
                className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full"
              />
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                #{tag}
                {isEditing && (
                  <button
                    onClick={() => onRemoveTag(tag)}
                    className="ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
            {isEditing && (
              <input
                type="text"
                value={newTag}
                onChange={(e) => onNewTagChange(e.target.value)}
                onKeyDown={onAddTag}
                placeholder="Add tag..."
                className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full"
              />
            )}
          </div>
        </div>

        {/* Social Links */}
        {socialLinks && socialLinks.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Social Links
            </h3>
            <SocialLinks links={socialLinks} />
          </div>
        )}
      </div>

      {/* Right section with action buttons */}
      <div className="flex md:flex-col gap-2 justify-center md:justify-start">
        {isOwnProfile ? (
          isEditing ? (
            <>
              <Button
                onClick={onSave}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
                className="gap-2"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={onEdit}
              className="gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Info
            </Button>
          )
        ) : null}

        <Button
          variant="outline"
          onClick={onShare}
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>
    </div>
  );
}