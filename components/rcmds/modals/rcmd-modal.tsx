import { useState } from 'react';
import { uploadContentImage } from '@/utils/storage';
import Image from 'next/image';

interface Props {
  onClose: () => void;
  onSave: (
    title: string,
    description: string,
    type: string,
    visibility: string,
    imageUrl?: string
  ) => Promise<void>;
  userId: string;
}

export default function RCMDModal({ onClose, onSave, userId }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('other');
  const [visibility, setVisibility] = useState('private');
  const [isSaving, setIsSaving] = useState(false);

  // New image states
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
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
        setUploadError('Please select an image file');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setUploadError('Image must be less than 5MB');
        return;
      }
      try {
        const dimensions = await getImageDimensions(selectedFile);
        setImageDimensions(dimensions);
        setFile(selectedFile);
        setUploadError(null);
      } catch {
        setUploadError('Failed to load image dimensions');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    try {
      setIsSaving(true);

      let imageUrl: string | undefined;

      if (file) {
        // Upload to 'rcmds' subfolder in content bucket
        imageUrl = await uploadContentImage(file, `${userId}/rcmds`);
      }

      await onSave(title, description, type, visibility, imageUrl);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Error saving RCMD');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">New RCMD</h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="other">Other</option>
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="place">Place</option>
                <option value="experience">Experience</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>

            {/* New image upload field */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Featured Image
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
                  </div>
                </div>
              )}
              {uploadError && (
                <div className="text-red-500 text-sm mt-1">{uploadError}</div>
              )}
            </div>

            {/* Existing buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}