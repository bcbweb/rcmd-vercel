"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
} from "react";
import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";

interface LinkInputProps {
  value: string;
  onChange: (value: string) => void;
  onMetadataFetch?: (metadata: LinkMetadata) => void;
  disabled?: boolean;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  hidePreview?: boolean;
}

export interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  type?: string;
  url?: string;
}

// Add this outside the component to use with the error handler
function getFaviconUrl(domain: string): string {
  return `https://icon.horse/icon/${domain}`;
}

// Helper function to extract domain correctly
function getDomainFromUrl(url: string): string {
  try {
    // Make sure we have a proper URL format
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const urlObj = new URL(normalizedUrl);
    return urlObj.hostname;
  } catch (error) {
    console.error("Error extracting domain:", error);
    return url.trim();
  }
}

// Convert to forwardRef to accept a ref for the input element
const LinkInput = forwardRef<HTMLInputElement, LinkInputProps>(
  (
    {
      value = "",
      onChange,
      onMetadataFetch,
      disabled = false,
      onClear,
      placeholder = "Enter URL...",
      className = "",
      hidePreview = false,
    },
    ref
  ) => {
    const [isValid, setIsValid] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [shouldFetch, setShouldFetch] = useState(false);

    // Use useMemo for the regex
    const urlRegex = useMemo(
      () => /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
      []
    );

    // Normalize URL for consistent processing
    const normalizeUrl = useCallback((url: string): string => {
      if (!url) return "";
      return url.startsWith("http") ? url : `https://${url}`;
    }, []);

    // Define fetch metadata function with useCallback
    const fetchMetadata = useCallback(async () => {
      if (!value || !urlRegex.test(value)) {
        setIsFetching(false);
        return;
      }

      setError(null);
      setIsFetching(true);

      try {
        // Add timeout to the fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const normalizedUrl = normalizeUrl(value);
        console.log("Fetching metadata for:", normalizedUrl);

        // Using proper error handling with try/catch for the API call
        const response = await fetch(
          `/api/metadata?url=${encodeURIComponent(normalizedUrl)}`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        console.log("Raw metadata response:", data);

        if (!data) {
          throw new Error("Empty response from metadata service");
        }

        // Check for error response
        if (data.error) {
          throw new Error(data.error);
        }

        // Get full domain for fallback values
        const fullDomain = getDomainFromUrl(normalizedUrl);

        // Process metadata to ensure necessary fields with fallbacks
        const processedMetadata = {
          ...data,
          // Only use fallbacks if the data doesn't exist
          title: data.title || fullDomain,
          description: data.description || `Content from ${fullDomain}`,
          url: data.url || normalizedUrl,
          // Add timestamp to force state update
          _timestamp: Date.now(),
        };

        // Log what we're using for each field
        console.log("Processed metadata fields:");
        console.log(
          `- title: ${data.title ? "FROM API" : "FALLBACK"} = "${processedMetadata.title}"`
        );
        console.log(
          `- description: ${data.description ? "FROM API" : "FALLBACK"} = "${processedMetadata.description?.substring(0, 30)}..."`
        );
        console.log(
          `- url: ${data.url ? "FROM API" : "NORMALIZED"} = "${processedMetadata.url}"`
        );

        // Set local state first
        setMetadata(processedMetadata);
        setError(null);

        // Only call onMetadataFetch after ensuring metadata is processed
        if (onMetadataFetch) {
          console.log("Calling onMetadataFetch with:", processedMetadata);

          // Add a delay to ensure React state updates properly and data is fully available
          setTimeout(() => {
            onMetadataFetch(processedMetadata);
          }, 250); // Increased delay for more reliability
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(`Could not fetch metadata: ${errorMessage}`);
        setMetadata(null);
      } finally {
        // Allow a short delay before marking fetch as complete
        setTimeout(() => {
          setIsFetching(false);
          setShouldFetch(false);
        }, 200);
      }
    }, [value, urlRegex, onMetadataFetch, normalizeUrl]);

    // Intelligent URL validation before fetch
    const validateAndPrepareFetch = useCallback(() => {
      if (!value) {
        setIsValid(true);
        return;
      }

      // Check if the URL appears to be complete with a reasonable domain pattern
      // This helps prevent fetches for incomplete URLs like "rcmd.wo" before the user finishes typing
      const isCompleteUrl = (() => {
        try {
          // Quick check for common TLDs to ensure URL appears complete
          const normalizedUrl = normalizeUrl(value);
          const domain = new URL(normalizedUrl).hostname;

          // Check if the domain ends with a common TLD or has at least 2 dots (like subdomain.domain.tld)
          const hasValidTld =
            /\.(com|org|net|edu|gov|io|co|world|app|dev|me|info|biz)$/i.test(
              domain
            );
          const hasTwoOrMoreDots = (domain.match(/\./g) || []).length >= 2;

          return hasValidTld || hasTwoOrMoreDots;
        } catch {
          // If URL parsing fails, use the regex check as fallback
          return urlRegex.test(value);
        }
      })();

      const isValidUrl = urlRegex.test(value);
      setIsValid(isValidUrl);

      // Only set up fetch if URL is valid, appears complete, and changed from last fetch
      if (
        isValidUrl &&
        isCompleteUrl &&
        value &&
        (!metadata?.url || normalizeUrl(value) !== metadata.url)
      ) {
        // Use debounce to wait until user stops typing
        setShouldFetch(true);
      }
    }, [value, metadata?.url, urlRegex, normalizeUrl]);

    // Debounce URL changes to prevent fetching while typing
    useEffect(() => {
      const debounceTimer = setTimeout(() => {
        validateAndPrepareFetch();
      }, 800); // 800ms debounce for typing

      return () => clearTimeout(debounceTimer);
    }, [value, validateAndPrepareFetch]);

    // Separate effect to trigger fetch when shouldFetch changes
    useEffect(() => {
      if (shouldFetch && !isFetching) {
        fetchMetadata();
      }
    }, [shouldFetch, isFetching, fetchMetadata]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value;
      onChange(url);

      // If user clears the input, also clear metadata
      if (!url) {
        setMetadata(null);
        setError(null);
      }
    };

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else {
        onChange("");
      }
      setMetadata(null);
      setError(null);
      setIsValid(true);
    };

    // Define a helper function to handle image fallbacks - outside the event handler
    const handleImageFallback = useCallback(
      (target: HTMLImageElement, metadata: LinkMetadata | null) => {
        // Set a data URL placeholder or domain icon
        const domain = (() => {
          try {
            if (metadata?.url) {
              return getDomainFromUrl(metadata.url);
            }
            return "";
          } catch {
            return "";
          }
        })();

        // If we can extract domain, use a favicon service as fallback
        if (domain) {
          target.src = getFaviconUrl(domain);
          // Set another fallback if favicon fails
          target.onerror = () => {
            target.onerror = null;
            // Show a colored placeholder with the first letter
            target.style.display = "none";
            const placeholderEl =
              target.parentElement?.querySelector(".image-placeholder");
            if (placeholderEl) {
              placeholderEl.classList.remove("hidden");
              // Set the placeholder text - add null check for metadata
              placeholderEl.textContent =
                metadata?.title?.charAt(0).toUpperCase() ||
                domain.charAt(0).toUpperCase() ||
                "?";
            }
          };
        } else {
          // Direct fallback to placeholder
          target.style.display = "none";
          const placeholderEl =
            target.parentElement?.querySelector(".image-placeholder");
          if (placeholderEl) {
            placeholderEl.classList.remove("hidden");
            // Set the placeholder text - add null check for metadata
            placeholderEl.textContent =
              metadata?.title?.charAt(0).toUpperCase() || "?";
          }
        }
      },
      []
    );

    return (
      <div className={`relative w-full ${className}`}>
        <div className="flex items-center relative w-full">
          <input
            type="text"
            value={value}
            onChange={handleChange}
            className={`w-full p-2 pl-10 border rounded-md ${
              !isValid && value ? "border-red-500" : ""
            } dark:bg-gray-700 dark:border-gray-600`}
            placeholder={placeholder}
            disabled={disabled}
            ref={ref}
          />

          {/* Link Icon */}
          <svg
            className="absolute left-3 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>

          {/* Loading Spinner */}
          {isFetching && (
            <div className="absolute right-3">
              <Spinner className="h-4 w-4" />
            </div>
          )}

          {/* Clear Button - only show when there's text and not fetching */}
          {value && !isFetching && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear input"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* URL Validation Message */}
        {!isValid && value && (
          <p className="text-red-500 text-sm mt-1">Please enter a valid URL</p>
        )}

        {/* Error Message */}
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

        {/* Preview Card */}
        {!hidePreview && metadata && !isFetching && (
          <div className="mt-4 border rounded-lg p-4 dark:border-gray-600">
            <div className="flex items-start space-x-4">
              {/* Favicon */}
              {metadata.favicon && (
                <Image
                  src={metadata.favicon}
                  alt="Site favicon"
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded"
                  onError={(e) => {
                    // Hide the image on error
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}

              <div className="flex-1 min-w-0">
                {/* Title */}
                {metadata.title && (
                  <h3 className="text-sm font-medium truncate">
                    {metadata.title}
                  </h3>
                )}

                {/* Description */}
                {metadata.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {metadata.description}
                  </p>
                )}

                {/* Domain */}
                <p className="text-xs text-gray-400 mt-1">
                  {value && value.trim() !== "" && urlRegex.test(value)
                    ? getDomainFromUrl(value)
                    : ""}
                </p>
              </div>

              {/* Preview Image */}
              {metadata.image && (
                <div className="flex-shrink-0 relative">
                  {/* Use Next.js Image when possible */}
                  <div
                    className="w-20 h-20 rounded overflow-hidden bg-gray-100 dark:bg-gray-700"
                    data-metadata-preview="true"
                  >
                    {/* We need to determine if we can use Next.js Image or fallback to img */}
                    {process.env.NODE_ENV === "development" ? (
                      // In development, use regular img tag to avoid domain restrictions
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={metadata.image}
                        alt="Link preview"
                        className="w-full h-full object-cover"
                        onError={(event) => {
                          // Add fallback image or show placeholder
                          const target =
                            event.currentTarget as HTMLImageElement;
                          target.onerror = null; // Prevent infinite error loop

                          // Use our fallback handler
                          handleImageFallback(target, metadata);
                        }}
                      />
                    ) : (
                      // In production, use proxy API with a dynamic import
                      <div className="w-full h-full relative">
                        <Image
                          src={`/api/proxy-image?url=${encodeURIComponent(metadata.image)}`}
                          alt="Link preview"
                          fill
                          className="object-cover"
                          onError={() => {
                            // Show favicon placeholder on error
                            const container = document.querySelector(
                              '[data-metadata-preview="true"]'
                            );
                            if (container) {
                              const placeholderEl =
                                container.querySelector(".image-placeholder");
                              if (placeholderEl) {
                                placeholderEl.classList.remove("hidden");
                                // Set the placeholder text
                                placeholderEl.textContent =
                                  metadata?.title?.charAt(0).toUpperCase() ||
                                  "?";
                              }
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Placeholder for when image fails - using empty content initially */}
                    <div className="image-placeholder hidden w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-800 text-blue-500 dark:text-blue-300 text-xl font-bold">
                      {/* Initialize with a question mark that will be replaced if needed */}
                      ?
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

// Add display name for better debugging
LinkInput.displayName = "LinkInput";

export default LinkInput;
