import Image from "next/image";
import ProfilePhotoUpload from "@/components/profile-photo-upload";

interface ProfilePhotoProps {
  isEditing: boolean;
  profilePictureUrl?: string;
  handle: string;
  firstName?: string;
  onUploadComplete: (url: string) => void;
}

export function ProfilePhoto({
  isEditing,
  profilePictureUrl,
  handle,
  firstName,
  onUploadComplete
}: ProfilePhotoProps) {
  return (
    <div className="flex justify-center md:justify-start md:absolute md:-top-32 md:left-4 mb-4 md:mb-0">
      {isEditing ? (
        <div className="w-40 h-40">
          <ProfilePhotoUpload
            onUploadComplete={onUploadComplete}
            currentPhotoUrl={profilePictureUrl}
          />
        </div>
      ) : (
        <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
          {profilePictureUrl ? (
            <Image
              src={profilePictureUrl}
              alt="Profile picture"
              fill
              className="object-cover"
              sizes="(max-width: 160px) 160px"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-4xl text-gray-500 dark:text-gray-400">
                {firstName?.charAt(0) || handle.charAt(0)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}