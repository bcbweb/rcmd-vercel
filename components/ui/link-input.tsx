"use client";

import React, { useState, useEffect, useCallback, forwardRef } from "react";
import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";

interface LinkMetadata {
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  type?: string;
  _timestamp?: number;
}

// Export the interface for use by other components
export type { LinkMetadata };

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

// Helper function to extract domain correctly - simplified
function getDomainFromUrl(url: string): string {
  try {
    // Make sure we have a proper URL format
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const urlObj = new URL(normalizedUrl);
    return urlObj.hostname;
  } catch {
    // Silent error handling - just return something safe
    return url.split("/")[0].split("?")[0].trim() || "unknown";
  }
}

// Add a failsafe wrapper component that prevents freezing
const SafeComponent = ({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  const [hasError, setHasError] = useState(false);

  // If an error occurs in the children, render the fallback
  if (hasError) {
    return (
      fallback || (
        <div className="text-red-500 text-sm">Error rendering component</div>
      )
    );
  }

  // Otherwise, wrap the children in an error boundary
  try {
    return <>{children}</>;
  } catch (error) {
    console.error("SafeComponent caught error:", error);
    setHasError(true);
    return (
      fallback || (
        <div className="text-red-500 text-sm">Error rendering component</div>
      )
    );
  }
};

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
    const [lastFetchedUrl, setLastFetchedUrl] = useState<string>("");
    const [isProblemURL, setIsProblemURL] = useState(false);

    // Add fetchCount ref at top level, not inside useEffect
    const fetchCount = React.useRef(0);

    // Add a timeout ref to prevent infinite operations
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Completely rewrite normalizeUrl for maximum stability - super simplified
    const normalizeUrl = useCallback((url: string): string => {
      if (!url) return "";

      // Extract only domain for comparison - ignore all else
      try {
        // Simple domain extraction
        const domain = url
          .replace(/^https?:\/\//i, "")
          .replace(/^www\./i, "")
          .split("/")[0]
          .split("?")[0]
          .toLowerCase();
        return domain;
      } catch {
        // Return a safe fallback
        return url.substring(0, 30).toLowerCase();
      }
    }, []);

    // Create a much simpler fetchMetadata function with timeout protection
    const fetchMetadata = useCallback(async () => {
      if (!value) {
        setIsFetching(false);
        return;
      }

      // If already fetching, don't do it again
      if (isFetching) return;

      // If this URL has caused problems before, skip it
      if (isProblemURL) {
        console.warn("Skipping known problem URL:", value);
        return;
      }

      // Set a timeout to prevent any operation from running too long
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        console.warn("Operation timeout for URL:", value);
        setIsFetching(false);
        setShouldFetch(false);
        setIsProblemURL(true);
        setError("This URL may not be compatible");
      }, 5000); // 5 second maximum for any fetch operation

      try {
        // Start fetching with proper state tracking
        setIsFetching(true);

        // Force reset metadata when URL changes to avoid stale images/data
        setMetadata(null);

        // Check for complex URLs with lots of parameters - mark as potentially problematic
        if (value.includes("?") && value.length > 100) {
          console.warn("Complex URL detected, proceeding with caution:", value);
        }

        // Normalize for comparison
        const normalizedUrl = normalizeUrl(value);

        // Skip if already fetched
        if (lastFetchedUrl === normalizedUrl && metadata?.url) {
          clearTimeout(timeoutRef.current);
          setIsFetching(false);
          setShouldFetch(false);
          return;
        }

        // Extremely safe fetch with proper abortion
        const controller = new AbortController();
        const fetchTimeoutId = setTimeout(() => controller.abort(), 3000);

        try {
          // Minimal URL encoding
          const encodedUrl = encodeURIComponent(value.substring(0, 500)); // Limit length

          // Safer fetch with timeout
          const response = await fetch(`/api/metadata?url=${encodedUrl}`, {
            signal: controller.signal,
          });

          clearTimeout(fetchTimeoutId);

          // Handle response errors
          if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
          }

          // Safely parse response
          const text = await response.text();
          let data;

          try {
            data = JSON.parse(text);
          } catch {
            throw new Error("Invalid response format");
          }

          // Process with caution - no image processing for complex URLs
          const domain = normalizedUrl || "unknown";

          // Create safe metadata - skip image for complex URLs with parameters
          const processedMetadata = {
            title: data?.title || domain,
            description: data?.description || `Content from ${domain}`,
            url: data?.url || value,
            // Skip images for URLs that are very complex, but preserve if it exists
            image:
              value.includes("?") && value.length > 100
                ? null
                : data?.image || null,
            favicon: data?.favicon,
            type: data?.type || "website",
            _timestamp: Date.now(),
          };

          // Update state
          setMetadata(processedMetadata);
          setLastFetchedUrl(normalizedUrl);
          setError(null);

          // Notify parent if needed
          if (onMetadataFetch) {
            onMetadataFetch(processedMetadata);
          }
        } catch (fetchError: unknown) {
          console.error("Fetch error:", fetchError);

          // User-friendly error messages
          let userMessage =
            "Unable to load website information. Please check the URL and try again.";

          if (fetchError instanceof Error) {
            // Log technical error to console
            console.error("Technical details:", fetchError.message);

            // Map specific technical errors to user-friendly messages
            if (fetchError.message.includes("aborted")) {
              userMessage =
                "This website isn't responding. Try a different URL or check if the website is accessible.";
            } else if (fetchError.message.includes("Server error: 404")) {
              userMessage = "Website not found. Please check the URL.";
            } else if (fetchError.message.includes("Server error: 403")) {
              userMessage = "This website is not accessible.";
            } else if (fetchError.message.includes("Invalid response format")) {
              userMessage = "Unable to read website information.";
            }
          }

          setError(userMessage);
          clearTimeout(fetchTimeoutId);

          // Also notify parent of the failure to clear previous metadata
          if (onMetadataFetch) {
            onMetadataFetch({
              url: value,
              title: normalizeUrl(value) || "Unknown site",
              _timestamp: Date.now(),
            });
          }
        }
      } catch (error) {
        console.error("Error in metadata processing:", error);
        setError("Unable to process website information. Please try again.");

        // Also notify parent of the failure
        if (onMetadataFetch) {
          onMetadataFetch({
            url: value,
            title: normalizeUrl(value) || "Unknown site",
            _timestamp: Date.now(),
          });
        }
      } finally {
        // Always clean up timeout and state
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsFetching(false);
        setShouldFetch(false);
      }
    }, [
      value,
      isFetching,
      lastFetchedUrl,
      metadata?.url,
      normalizeUrl,
      onMetadataFetch,
      isProblemURL,
    ]);

    // Simplify validation to absolute minimum
    const validateAndPrepareFetch = useCallback(() => {
      // Fast exit for empty URLs
      if (!value || value.length < 5) {
        setIsValid(true);
        return;
      }

      // Simplest possible validation - just check for a dot
      const hasValidDomain = value.includes(".");
      setIsValid(hasValidDomain);

      // Don't fetch for invalid URLs or if already fetching
      if (!hasValidDomain || isFetching || isProblemURL) return;

      // Only fetch if URL changed
      try {
        const normalizedUrl = normalizeUrl(value);
        if (normalizedUrl !== lastFetchedUrl) {
          // Reset metadata for URL changes to prevent stale data
          setMetadata(null);
          setShouldFetch(true);
        }
      } catch {
        console.error("Error in validate:");
      }
    }, [value, isFetching, lastFetchedUrl, normalizeUrl, isProblemURL]);

    // Circuit breaker useEffect
    useEffect(() => {
      if (shouldFetch) {
        fetchCount.current += 1;

        // If we've tried to fetch more than 2 times for the same URL, mark as problematic
        if (fetchCount.current > 2) {
          console.warn("Circuit breaker activated for URL:", value);
          setShouldFetch(false);
          setIsFetching(false);
          setIsProblemURL(true);
          setError("This URL may not be compatible");
          fetchCount.current = 0;
        }
      }

      return () => {
        fetchCount.current = 0;
      };
    }, [value, shouldFetch]);

    // Debounce URL changes
    useEffect(() => {
      // Skip for empty URLs
      if (!value || value.length < 5) return;

      // Skip for problem URLs
      if (isProblemURL) return;

      // Clear any existing timeout
      const debounceTimer = setTimeout(() => {
        validateAndPrepareFetch();
      }, 800);

      return () => clearTimeout(debounceTimer);
    }, [value, validateAndPrepareFetch, isProblemURL]);

    // Trigger fetch when shouldFetch becomes true
    useEffect(() => {
      if (shouldFetch && !isFetching && !isProblemURL) {
        fetchMetadata();
      }
    }, [shouldFetch, isFetching, fetchMetadata, isProblemURL]);

    // External clear detection
    useEffect(() => {
      if ((!value || value.trim() === "") && (metadata || lastFetchedUrl)) {
        setMetadata(null);
        setLastFetchedUrl("");
        setError(null);
        setShouldFetch(false);
        setIsProblemURL(false);
      }
    }, [value, metadata, lastFetchedUrl]);

    // Complete reset function
    const resetComponent = useCallback(() => {
      setMetadata(null);
      setLastFetchedUrl("");
      setError(null);
      setShouldFetch(false);
      setIsValid(true);
      setIsFetching(false);
      setIsProblemURL(false);
      fetchCount.current = 0;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    // Handle input change with safety
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value;
      onChange(url);

      // Reset problem URL status when input changes completely
      if (isProblemURL && url !== value) {
        setIsProblemURL(false);
      }

      // Reset fetch state for URL changes
      try {
        if (normalizeUrl(url) !== lastFetchedUrl) {
          // Clear metadata when URL changes
          setMetadata(null);
          setShouldFetch(false);
          // Notify parent that metadata is being cleared
          if (onMetadataFetch) {
            onMetadataFetch({ url: url, _timestamp: Date.now() });
          }
        }
      } catch {
        console.error("Error in handleChange");
        setShouldFetch(false);
      }

      // Clear on empty
      if (!url || url.trim() === "") {
        requestAnimationFrame(() => {
          resetComponent();
        });
      }
    };

    // Handle clear button click
    const handleClear = () => {
      const inputRef = ref as React.MutableRefObject<HTMLInputElement | null>;

      if (onClear) {
        onClear();
      } else {
        onChange("");
      }

      requestAnimationFrame(() => {
        resetComponent();

        if (inputRef?.current) {
          inputRef.current.focus();
        }
      });
    };

    // Clean up on unmount
    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsFetching(false);
        setShouldFetch(false);
        setMetadata(null);
        setLastFetchedUrl("");
      };
    }, []);

    // Render the component with safety wrappers
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

          {/* Clear Button */}
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

        {/* Validation Message */}
        {!isValid && value && (
          <p className="text-red-500 text-sm mt-1">Please enter a valid URL</p>
        )}

        {/* Error Message */}
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

        {/* Preview Card - wrapped in SafeComponent to prevent crashes */}
        <SafeComponent
          fallback={
            <div className="mt-4 p-2 border rounded-md text-yellow-600 bg-yellow-50 dark:bg-yellow-900 dark:text-yellow-200">
              Preview not available for this URL
            </div>
          }
        >
          {/* Force remount of preview container when metadata changes */}
          <div
            className={`mt-4 overflow-hidden transition-all duration-300 ease-in-out ${
              !hidePreview && metadata && !isProblemURL
                ? "max-h-96 opacity-100"
                : "max-h-0 opacity-0"
            }`}
            key={`container-${metadata?._timestamp || Date.now()}`}
          >
            {metadata && !isProblemURL && (
              <div
                className={`border rounded-lg p-4 dark:border-gray-600 ${
                  isFetching ? "opacity-60" : "opacity-100"
                } transition-opacity duration-200`}
                key={`preview-${metadata._timestamp || Date.now()}`}
                data-testid="metadata-preview"
              >
                <div className="flex items-start space-x-4">
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
                      {getDomainFromUrl(value)}
                    </p>
                  </div>

                  {/* Only render image if it exists and we're not dealing with a problem URL */}
                  {metadata.image && !isProblemURL && (
                    <div className="flex-shrink-0 relative">
                      <div
                        className="w-20 h-20 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                        key={`img-container-${metadata._timestamp || Date.now()}`}
                      >
                        {/* Use Next.js Image component for better performance */}
                        {metadata.image ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={metadata.image}
                              alt={metadata.title || "Preview"}
                              fill
                              sizes="80px"
                              className="object-cover"
                              onError={() => {
                                // When image fails to load, show a fallback
                                const container = document.getElementById(
                                  `img-container-${metadata._timestamp || Date.now()}`
                                );
                                if (container) {
                                  container.innerHTML = `<div class="text-2xl font-bold text-gray-300">
                                    ${metadata.title?.[0]?.toUpperCase() || "?"}
                                  </div>`;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="text-2xl font-bold text-gray-300">
                            {metadata.title?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </SafeComponent>
      </div>
    );
  }
);

// Add display name for better debugging
LinkInput.displayName = "LinkInput";

export default LinkInput;
