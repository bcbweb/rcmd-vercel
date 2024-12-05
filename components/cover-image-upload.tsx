import { useState } from 'react';
import Image from 'next/image';
import { Upload } from 'lucide-react';
import { uploadCoverImage } from '@/utils/storage';
import { toast } from 'sonner';

interface CoverImageUploadProps {
  currentImageUrl?: string;
  onUploadComplete: (url: string) => void;
}

export default function CoverImageUpload({
  currentImageUrl,
  onUploadComplete
}: CoverImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const url = await uploadCoverImage(file);
      onUploadComplete(url);
      toast.success('Cover image updated');
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast.error('Failed to upload cover image');
      setPreviewUrl(currentImageUrl);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative w-full h-[350px] mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
      {previewUrl ? (
        <Image
          src={previewUrl}
          alt="Cover image"
          fill
          className="object-cover"
          sizes="(max-width: 1280px) 100vw, 1280px"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
      )}

      <label className="absolute bottom-4 right-4 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <Upload className={`w-5 h-5 ${isUploading ? 'animate-pulse' : ''}`} />
      </label>
    </div>
  );
}