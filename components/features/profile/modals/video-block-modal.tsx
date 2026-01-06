"use client";

import { useState } from "react";
import { useModalStore } from "@/stores/modal-store";
import { useBlockStore } from "@/stores/block-store";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Play } from "lucide-react";

interface Props {
  profileId: string;
  pageId?: string;
  onSuccess?: () => void;
}

// Helper functions to extract video ID and type from URL
const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

const extractVimeoId = (url: string): string | null => {
  const patterns = [
    /(?:vimeo\.com\/)(\d+)/,
    /(?:player\.vimeo\.com\/video\/)(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

const detectVideoType = (url: string): "youtube" | "vimeo" | null => {
  if (extractYouTubeId(url)) return "youtube";
  if (extractVimeoId(url)) return "vimeo";
  return null;
};

export default function VideoBlockModal({
  profileId,
  pageId,
  onSuccess,
}: Props) {
  const [videoUrl, setVideoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setIsVideoBlockModalOpen } = useModalStore();
  const { saveVideoBlock } = useBlockStore();

  const handleSave = async () => {
    if (!videoUrl.trim()) {
      setError("Please enter a video URL");
      return;
    }

    // Detect video type and extract ID
    const videoType = detectVideoType(videoUrl);
    if (!videoType) {
      setError("Invalid video URL. Please enter a valid YouTube or Vimeo URL.");
      return;
    }

    const videoId =
      videoType === "youtube"
        ? extractYouTubeId(videoUrl)
        : extractVimeoId(videoUrl);

    if (!videoId) {
      setError(
        "Could not extract video ID from URL. Please check the URL format."
      );
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      console.log("[DEBUG] Saving video block:", {
        profileId,
        pageId,
        videoUrl,
        videoType,
        videoId,
      });

      const success = await saveVideoBlock(
        profileId,
        videoUrl,
        videoType,
        videoId,
        caption || undefined,
        pageId
      );

      if (success) {
        toast.success("Video block added successfully");
        onSuccess?.();
        setIsVideoBlockModalOpen(false);
        setVideoUrl("");
        setCaption("");
      } else {
        setError("Failed to save video block");
      }
    } catch (error) {
      console.error("[DEBUG] Error saving video block:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Failed to save video block";
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setIsVideoBlockModalOpen(false);
  };

  return (
    <>
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
              Add Video Block
            </h2>
            <div className="w-8"></div> {/* Empty spacer for balance */}
          </div>

          <div className="mb-4">
            <label
              htmlFor="videoUrl"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Video URL (YouTube or Vimeo)
            </label>
            <input
              id="videoUrl"
              type="text"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                setError(null);
              }}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 
                dark:border-gray-600 dark:text-gray-100 focus:outline-none 
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
              disabled={isSaving}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Supported: YouTube and Vimeo URLs
            </p>
          </div>

          <div className="mb-4">
            <label
              htmlFor="caption"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Caption (Optional)
            </label>
            <input
              id="caption"
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 
                dark:border-gray-600 dark:text-gray-100 focus:outline-none 
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Optional caption for the video"
              disabled={isSaving}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                dark:hover:text-gray-200 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !videoUrl.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Add Video</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
