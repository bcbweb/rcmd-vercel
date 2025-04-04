"use client";

import { useState, useCallback } from 'react';
import { uploadProfileImage } from '@/utils/storage';
import Image from 'next/image';

interface ProfilePhotoUploadProps {
  onUploadComplete: (url: string) => void;
  currentPhotoUrl?: string;
}

export default function ProfilePhotoUpload({
  onUploadComplete,
  currentPhotoUrl
}: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(currentPhotoUrl || '');
  const [error, setError] = useState<string>('');

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError('');
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      // Show preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Start upload
      setUploading(true);

      // Upload using our utility function
      const publicUrl = await uploadProfileImage(file);

      // Call the callback with the public URL
      onUploadComplete(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label className="relative flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-full cursor-pointer hover:border-gray-400 dark:hover:border-gray-500">
          {preview ? (
            <Image
              src={preview}
              alt="Profile preview"
              fill
              className="object-cover rounded-full"
            />
          ) : (
            <div className="flex flex-col items-center justify-center pt-7">
              <svg
                className="w-12 h-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Click to upload
              </p>
            </div>
          )}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
      </div>

      {error && (
        <p className="text-sm text-center text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {uploading && (
        <p className="text-sm text-center text-gray-500 dark:text-gray-400">
          Uploading...
        </p>
      )}
    </div>
  );
}