"use client";

import { useState, useEffect, useRef } from "react";
import { useModalStore } from "@/stores/modal-store";
import { useLinkStore } from "@/stores/link-store";
import { Spinner } from "@/components/ui/spinner";
import LinkInput from "@/components/ui/link-input";
import { LinkMetadata } from "@/types";

export default function LinkModal() {
  const { isLinkModalOpen, setIsLinkModalOpen, onModalSuccess } =
    useModalStore();
  const { insertLink, isLoading } = useLinkStore();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("other");
  const [visibility, setVisibility] = useState("private");
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [receivedMetadata, setReceivedMetadata] = useState<LinkMetadata | null>(
    null
  );

  // Create a ref for the URL input to focus it
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Focus the URL field when the modal opens
  useEffect(() => {
    if (isLinkModalOpen && urlInputRef.current) {
      // Use requestAnimationFrame to sync with browser rendering
      const focusInput = () => {
        // Use a single focus call with proper timing
        requestAnimationFrame(() => {
          urlInputRef.current?.focus();
        });
      };

      // Wait for modal to be fully rendered
      setTimeout(focusInput, 150);
    }
  }, [isLinkModalOpen]);

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setDescription("");
    setType("other");
    setVisibility("private");
    setMetadataError(null);
    setReceivedMetadata(null);
  };

  const handleClose = () => {
    setIsLinkModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const link = await insertLink(title, url, description, type, visibility);

    if (link) {
      onModalSuccess?.();
      resetForm();
      handleClose();
    }
  };

  const sanitizeText = (
    text: string | undefined,
    maxLength: number
  ): string => {
    if (!text) return "";

    // Remove HTML tags and decode HTML entities
    const div = document.createElement("div");
    div.innerHTML = text;
    const sanitized = div.textContent || div.innerText || "";

    // Remove control characters and trim whitespace
    return sanitized
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
      .trim()
      .slice(0, maxLength);
  };

  const handleMetadataFetch = (metadata: LinkMetadata) => {
    try {
      setIsLoadingMetadata(true);
      setMetadataError(null);

      console.log("LinkModal received raw metadata:", metadata);

      // Check if the received metadata contains actual website data
      // or just fallbacks based on domain name
      const url = metadata.url || "";
      const domain = url.split("//")[1]?.split("/")[0] || "";

      // Enhanced check for fallback metadata or incomplete URLs
      const isLikelyFallback =
        // Check if title is just the domain
        (metadata.title === domain || metadata.title?.includes(domain)) &&
        // Check if description is the generic content message
        metadata.description === `Content from ${domain}` &&
        // Check if the domain looks incomplete (no real TLD or very short)
        (domain.length < 6 || // Very short domain names are suspicious
          !/\.(com|org|net|edu|gov|io|co|world|app|dev|me|info|biz)$/i.test(
            domain
          ) || // No common TLD
          /\.w{1,2}$/i.test(domain)); // Incomplete TLD like .w or .wo

      if (isLikelyFallback) {
        console.warn(
          "Received what appears to be fallback metadata or incomplete URL:",
          metadata
        );
        setMetadataError(
          "Could not retrieve website information. Please enter a complete URL."
        );
        return; // Don't proceed with setting metadata from fallbacks
      }

      // Validate the metadata has the expected fields before storing
      if (!metadata || (!metadata.title && !metadata.description)) {
        console.warn("Received incomplete metadata:", metadata);
      }

      // Store incoming metadata in state rather than immediately updating form fields
      setReceivedMetadata(metadata);
    } catch (error) {
      console.error("Error processing metadata in LinkModal:", error);
      setMetadataError("Failed to process metadata");
      setReceivedMetadata(null);
      setIsLoadingMetadata(false);
    }
  };

  // Use effect to process metadata after it's been received
  useEffect(() => {
    if (receivedMetadata) {
      // Use a larger delay to ensure the metadata has fully processed
      const timer = setTimeout(() => {
        console.log("Processing stored metadata:", receivedMetadata);

        try {
          // Always normalize the URL if available
          if (receivedMetadata.url) {
            console.log(`Setting URL to: ${receivedMetadata.url}`);
            setUrl(receivedMetadata.url);
          }

          // Always set title if available in metadata
          if (receivedMetadata.title) {
            const sanitizedTitle = sanitizeText(receivedMetadata.title, 100);
            console.log(`Setting title to: "${sanitizedTitle}"`);
            setTitle(sanitizedTitle);
          }

          // Always set description if available in metadata
          if (receivedMetadata.description) {
            const sanitizedDescription = sanitizeText(
              receivedMetadata.description,
              500
            );
            console.log(
              `Setting description to: "${sanitizedDescription.substring(0, 30)}..."`
            );
            setDescription(sanitizedDescription);
          }

          // Set type based on metadata
          if (receivedMetadata.type) {
            const detectedType = receivedMetadata.type.toLowerCase();
            if (
              ["article", "video", "podcast", "product"].includes(detectedType)
            ) {
              console.log(`Setting content type to: ${detectedType}`);
              setType(detectedType);
            }
          }
        } catch (error) {
          console.error("Error while setting form fields:", error);
          setMetadataError("Error applying metadata to form");
        } finally {
          // Reset loading state
          setIsLoadingMetadata(false);
        }
      }, 750); // Increased delay to ensure metadata processing completes

      return () => clearTimeout(timer);
    } else {
      setIsLoadingMetadata(false);
    }
  }, [receivedMetadata]);

  // Add handler for URL clearing
  const handleUrlClear = () => {
    console.log("LinkModal: URL clear requested");
    setUrl("");
    setReceivedMetadata(null);
    setMetadataError(null);

    // Only reset these if they were likely set from metadata
    if (!url) {
      setTitle("");
      setDescription("");
      setType("other");
    }

    console.log("LinkModal: URL clear completed");
  };

  // Effect to clear metadata when URL changes
  useEffect(() => {
    // If URL is cleared or significantly changed, clear any existing metadata
    if (!url || url.trim() === "") {
      setReceivedMetadata(null);
    }
  }, [url]);

  if (!isLinkModalOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose} // Close when clicking the background
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        <h2 className="text-lg font-semibold p-6 pb-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] z-10">
          New Link
        </h2>

        <form onSubmit={handleFormSubmit}>
          <div
            className="overflow-y-auto px-6 flex-grow"
            style={{ maxHeight: "calc(90vh - 150px)" }}
          >
            <div className="space-y-4 pb-6 pt-2">
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <LinkInput
                  value={url}
                  onChange={(newUrl) => {
                    setUrl(newUrl);
                  }}
                  onMetadataFetch={handleMetadataFetch}
                  onClear={handleUrlClear}
                  disabled={isLoading}
                  ref={urlInputRef}
                />
                {isLoadingMetadata && (
                  <div className="mt-1 text-sm text-blue-500 flex items-center">
                    <Spinner className="h-3 w-3 mr-2" />
                    Loading metadata...
                  </div>
                )}
                {metadataError && (
                  <div className="mt-1 text-sm text-red-500">
                    {metadataError}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="other">Other</option>
                  <option value="article">Article</option>
                  <option value="video">Video</option>
                  <option value="podcast">Podcast</option>
                  <option value="product">Product</option>
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
            </div>
          </div>

          <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto bg-white dark:bg-gray-800 sticky bottom-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-10">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                  dark:hover:text-gray-300"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-blue-500 hover:text-blue-700 border border-blue-300 rounded"
                disabled={isLoading}
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                  disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
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
        </form>
      </div>
    </div>
  );
}
