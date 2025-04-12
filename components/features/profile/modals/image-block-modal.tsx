"use client";

import { useState } from "react";
import { uploadContentImage } from "@/utils/storage";
import { useModalStore } from "@/stores/modal-store";
import { useBlockStore } from "@/stores/block-store";
import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";

interface Props {
  profileId: string;
  pageId?: string;
  onSuccess?: () => void;
}

export default function ImageBlockModal({
  profileId,
  pageId,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const { setIsImageBlockModalOpen } = useModalStore();
  const { saveImageBlock } = useBlockStore();

  const getImageDimensions = (
    file: File
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        reject(new Error("Failed to load image dimensions"));
        URL.revokeObjectURL(img.src);
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB");
        return;
      }
      try {
        const dimensions = await getImageDimensions(selectedFile);
        setImageDimensions(dimensions);
        setFile(selectedFile);
        setError(null);
      } catch {
        setError("Failed to load image dimensions");
      }
    }
  };

  const handleSave = async () => {
    if (!file || !imageDimensions) {
      setError("Please select an image");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const publicUrl = await uploadContentImage(file);

      const success = await saveImageBlock(
        profileId,
        publicUrl,
        caption,
        file.name,
        file.size,
        file.type,
        imageDimensions.width,
        imageDimensions.height,
        pageId
      );

      if (success) {
        onSuccess?.();
        setIsImageBlockModalOpen(false);
      } else {
        setError("Failed to save image block");
      }
    } catch (err) {
      console.error("Error saving image block:", err);
      setError(err instanceof Error ? err.message : "Error saving image block");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setIsImageBlockModalOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleClose}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 
              dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 
              rounded-full transition-colors"
            aria-label="Back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-arrow-left"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold flex-1 text-center">
            Add Image Block
          </h2>
          <div className="w-8"></div> {/* Empty spacer for balance */}
        </div>
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
                  <div>
                    Dimensions: {imageDimensions.width}x{imageDimensions.height}
                    px
                  </div>
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
        {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => setIsImageBlockModalOpen(false)}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
              dark:hover:text-gray-200 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !file || !imageDimensions}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Spinner className="h-4 w-4" />
                <span>Saving...</span>
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
