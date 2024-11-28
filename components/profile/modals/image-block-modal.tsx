import { useState } from 'react';
import { uploadContentImage } from '@/utils/storage';
import Image from 'next/image';

interface Props {
  onClose: () => void;
  onSave: (
    imageUrl: string,
    caption: string,
    originalFilename: string,
    sizeBytes: number,
    mimeType: string,
    width: number,
    height: number
  ) => void;
  userId: string;
}

export default function ImageBlockModal({ onClose, onSave, userId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number; } | null>(null);

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
        setFile(selectedFile);
        setError(null);
      } catch {
        setError('Failed to load image dimensions');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !imageDimensions) {
      setError('Please select an image');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const publicUrl = await uploadContentImage(file, userId);

      // Pass all metadata
      onSave(
        publicUrl,
        caption,
        file.name,
        file.size,
        file.type,
        imageDimensions.width,
        imageDimensions.height
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-lg font-semibold mb-4">Add Image Block</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Image
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
                required
              />
            </label>
            {file && (
              <div className="mt-2">
                <Image
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  width={200}
                  height={200}
                  className="max-h-40 object-contain"
                />
                <div className="text-sm text-gray-500 mt-1">
                  <div>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  {imageDimensions && (
                    <div>Dimensions: {imageDimensions.width}x{imageDimensions.height}px</div>
                  )}
                  <div>Type: {file.type}</div>
                </div>
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Caption
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              />
            </label>
          </div>
          {error && (
            <div className="mb-4 text-red-500 text-sm">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={uploading || !file || !imageDimensions}
            >
              {uploading ? 'Uploading...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}