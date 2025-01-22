import Image from "next/image";
import CoverImageUpload from "@/components/cover-image-upload";

interface CoverImageProps {
  isEditing: boolean;
  coverImageUrl?: string;
  onUploadComplete: (url: string) => void;
}

export function CoverImage({
  isEditing,
  coverImageUrl,
  onUploadComplete
}: CoverImageProps) {
  return (
    <div className="relative w-full h-[250px] md:h-[350px] mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
      {isEditing ? (
        <CoverImageUpload
          currentImageUrl={coverImageUrl}
          onUploadComplete={onUploadComplete}
        />
      ) : (
        coverImageUrl ? (
          <Image
            src={coverImageUrl}
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
  );
}