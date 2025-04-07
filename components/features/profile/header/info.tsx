import { X, Share2, Edit2, Save, XCircle } from "lucide-react";
import { SocialLinks } from "./social-links";
import { Button } from "@/components/ui/button";

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
  socialLinks?: Array<{ platform: string; handle: string }>;
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
  onShare,
}: ProfileInfoProps) {
  const fullName = [formData.firstName, formData.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="w-full flex flex-col md:flex-row justify-between gap-3">
      {/* Left section with profile info */}
      <div className="flex-grow space-y-2.5">
        {/* Name, Handle and Location - grouped together with less spacing */}
        <div className="space-y-1">
          {isEditing ? (
            <div className="flex flex-col md:flex-row gap-2 mb-1.5">
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => onFormChange("firstName", e.target.value)}
                placeholder="First name"
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-base md:w-1/2"
              />
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => onFormChange("lastName", e.target.value)}
                placeholder="Last name"
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-base md:w-1/2"
              />
            </div>
          ) : (
            <h1 className="text-xl md:text-2xl font-bold dark:text-white">
              {fullName || handle}
            </h1>
          )}
          <div className="flex flex-wrap items-center gap-x-3">
            <p className="text-gray-500 dark:text-gray-400">@{handle}</p>
            {location && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                📍 {location}
              </p>
            )}
          </div>
        </div>

        {/* Bio - adjust height and padding for more efficient space usage */}
        {(isEditing || formData.bio) && (
          <div>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => onFormChange("bio", e.target.value)}
                placeholder="Write a bio..."
                rows={2}
                className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm"
              />
            ) : formData.bio ? (
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {formData.bio}
              </p>
            ) : null}
          </div>
        )}

        {/* Interests and Tags section - condensed with smaller labels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
          {/* Interests */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Interests
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {formData.interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                >
                  {interest}
                  {isEditing && (
                    <button
                      onClick={() => onRemoveInterest(interest)}
                      className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
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
                  placeholder="Add..."
                  className="px-2 py-0.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full w-20"
                />
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  #{tag}
                  {isEditing && (
                    <button
                      onClick={() => onRemoveTag(tag)}
                      className="ml-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
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
                  placeholder="Add..."
                  className="px-2 py-0.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full w-20"
                />
              )}
            </div>
          </div>
        </div>

        {/* Social Links - reduced margins */}
        {socialLinks && socialLinks.length > 0 && (
          <div className="mt-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Social Links
            </h3>
            <SocialLinks links={socialLinks} />
          </div>
        )}
      </div>

      {/* Right section with action buttons - more compact */}
      <div className="flex md:flex-col gap-2 mt-2 md:mt-0">
        {isOwnProfile ? (
          isEditing ? (
            <>
              <Button
                onClick={onSave}
                className="gap-1 py-1 h-auto text-sm"
                size="sm"
              >
                <Save className="w-3.5 h-3.5" />
                Save
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
                className="gap-1 py-1 h-auto text-sm"
                size="sm"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={onEdit}
              className="gap-1 py-1 h-auto text-sm"
              size="sm"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Info
            </Button>
          )
        ) : null}

        <Button
          variant="outline"
          onClick={onShare}
          className="gap-1 py-1 h-auto text-sm"
          size="sm"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </Button>
      </div>
    </div>
  );
}
