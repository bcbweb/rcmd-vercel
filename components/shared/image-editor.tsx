import Image from 'next/image';
import { useState } from 'react';
import { useSupabase } from '@/components/providers/supabase-provider';
import { uploadContentImage } from '@/utils/storage';

interface ImageMetadata {
  size?: number;
  width?: number;
  height?: number;
  type?: string;
}

interface ImagePreviewProps {
  src: string;
  alt: string;
  metadata?: ImageMetadata;
  onClearNew?: () => void;
  isNewImage?: boolean;
}

function ImagePreview({ src, alt, metadata, onClearNew, isNewImage }: ImagePreviewProps) {
  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Image Preview</h3>
        {isNewImage && onClearNew && (
          <button
            onClick={onClearNew}
            className="text-sm text-red-500 hover:text-red-600"
          >
            Reset to Current Image
          </button>
        )}
      </div>
      <div className="aspect-video relative w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
        />
      </div>
      {metadata && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 space-y-1">
          {metadata.size && (
            <div>Size: {(metadata.size / 1024 / 1024).toFixed(2)} MB</div>
          )}
          {metadata.width && metadata.height && (
            <div>Dimensions: {metadata.width}x{metadata.height}px</div>
          )}
          {metadata.type && (
            <div>Type: {metadata.type}</div>
          )}
        </div>
      )}
    </div>
  );
}

export interface ImageEditorResult {
  image_url: string;
  width?: number;
  height?: number;
  caption?: string | null;
}

export interface ImageEditorProps {
  currentImageUrl: string;
  currentCaption?: string | null;
  currentWidth?: number;
  currentHeight?: number;
  onSave: (result: ImageEditorResult) => Promise<void>;
  onCancel: () => void;
  showCaption?: boolean;
  subfolder?: string;
}

export default function ImageEditor({
  currentImageUrl,
  currentCaption = '',
  currentWidth,
  currentHeight,
  onSave,
  onCancel,
  showCaption = true,
  subfolder,
}: ImageEditorProps) {
  const { supabase } = useSupabase();
  const [imageUrl] = useState(currentImageUrl);
  const [caption, setCaption] = useState(currentCaption ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number; } | undefined>(
    currentWidth && currentHeight ? { width: currentWidth, height: currentHeight } : undefined
  );
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const getImageDimensions = (file: File): Promise<{ width: number; height: number; }> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image dimensions'));
        URL.revokeObjectURL(img.src);
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      try {
        const dimensions = await getImageDimensions(selectedFile);
        setImageDimensions(dimensions);
        setPreviewFile(selectedFile);
        setError(null);
      } catch {
        setError('Failed to load image dimensions');
      }
    }
  };

  const handleClearNew = () => {
    setPreviewFile(null);
    setImageDimensions(currentWidth && currentHeight
      ? { width: currentWidth, height: currentHeight }
      : undefined
    );
    setError(null);
  };

  const handleSave = async () => {
    try {
      setUploading(true);
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Authentication required');
      }

      let finalImageUrl = imageUrl;
      let finalDimensions = imageDimensions;

      if (previewFile) {
        finalImageUrl = await uploadContentImage(previewFile, user.id, subfolder);
        finalDimensions = await getImageDimensions(previewFile);
      }

      await onSave({
        image_url: finalImageUrl,
        caption: caption || null,
        ...(finalDimensions && {
          width: finalDimensions.width,
          height: finalDimensions.height,
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <ImagePreview
          src={previewFile ? URL.createObjectURL(previewFile) : currentImageUrl}
          alt={caption || ""}
          metadata={previewFile ? {
            size: previewFile.size,
            width: imageDimensions?.width,
            height: imageDimensions?.height,
            type: previewFile.type
          } : {
            width: currentWidth,
            height: currentHeight
          }}
          onClearNew={handleClearNew}
          isNewImage={!!previewFile}
        />

        <div>
          <label className="block text-sm font-medium mb-2">
            Upload New Image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                dark:file:bg-gray-700 dark:file:text-gray-200"
            />
          </label>
        </div>
      </div>

      {showCaption && (
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-gray-700 
                   text-gray-900 dark:text-gray-100 
                   border-gray-300 dark:border-gray-600"
          placeholder="Caption (optional)"
        />
      )}

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-gray-600 dark:text-gray-300 
                   hover:text-gray-800 dark:hover:text-gray-100"
          disabled={uploading}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={uploading}
          className="px-3 py-1 bg-blue-500 text-white rounded 
                   hover:bg-blue-600 dark:hover:bg-blue-400
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}