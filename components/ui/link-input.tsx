"use client";

import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

interface LinkInputProps {
  value: string;
  onChange: (value: string) => void;
  onMetadataFetch?: (metadata: LinkMetadata) => void;
  disabled?: boolean;
  onClear?: () => void;
}

interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  type?: string;
  url?: string;
}

export default function LinkInput({
  value,
  onChange,
  onMetadataFetch,
  disabled = false,
  onClear,
}: LinkInputProps) {
  const [isValid, setIsValid] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [debouncedValue, setDebouncedValue] = useState(value);

  // URL validation regex
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

  // Debounce the URL value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  // Fetch metadata when debounced URL changes
  useEffect(() => {
    // Don't fetch if there's no URL or it's invalid
    if (!debouncedValue || !urlRegex.test(debouncedValue)) {
      setMetadata(null);
      setIsFetching(false);
      return;
    }

    // Skip fetching if we're already fetching this same URL
    if (isFetching && metadata?.url === debouncedValue) {
      return;
    }

    const fetchMetadata = async () => {
      // Don't fetch if we already have metadata for this URL
      if (metadata?.url === debouncedValue) {
        return;
      }

      setIsFetching(true);
      try {
        // You'll need to implement this API endpoint
        const response = await fetch("/api/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: debouncedValue }),
        });

        if (!response.ok) throw new Error("Failed to fetch metadata");

        const data = await response.json();

        // Add the URL to the metadata for reference
        const metadataWithUrl = {
          ...data,
          url: debouncedValue,
        };

        setMetadata(metadataWithUrl);
        onMetadataFetch?.(metadataWithUrl);
      } catch (error) {
        console.error("Error fetching metadata:", error);
        setMetadata(null);
      } finally {
        setIsFetching(false);
      }
    };

    fetchMetadata();
  }, [debouncedValue, onMetadataFetch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Auto-prefix http:// if needed
    let formattedValue = newValue;
    if (
      newValue &&
      !newValue.startsWith("http://") &&
      !newValue.startsWith("https://") &&
      newValue.includes(".")
    ) {
      formattedValue = `https://${newValue}`;
    }

    // Only update validity if value isn't empty
    setIsValid(!newValue || urlRegex.test(formattedValue));
    onChange(formattedValue);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* URL Input */}
        <div className="relative flex items-center">
          <input
            type="url"
            value={value}
            onChange={handleChange}
            disabled={disabled}
            placeholder="https://example.com"
            className={`
              w-full p-2 pl-10 border rounded-md 
              dark:bg-gray-700 dark:border-gray-600
              ${!isValid && value ? "border-red-500" : ""}
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              ${isFetching || value ? "pr-10" : ""} 
            `}
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
          {value && !isFetching && onClear && !disabled && (
            <button
              type="button"
              onClick={onClear}
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
      </div>

      {/* Preview Card */}
      {metadata && !isFetching && (
        <div className="mt-4 border rounded-lg p-4 dark:border-gray-600">
          <div className="flex items-start space-x-4">
            {/* Favicon */}
            {metadata.favicon && (
              <img
                src={metadata.favicon}
                alt="Site favicon"
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
                  ? (() => {
                      try {
                        return new URL(value).hostname;
                      } catch (
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        _error
                      ) {
                        return "";
                      }
                    })()
                  : ""}
              </p>
            </div>

            {/* Preview Image */}
            {metadata.image && (
              <img
                src={metadata.image}
                alt="Link preview"
                className="w-20 h-20 object-cover rounded"
                onError={(event) => {
                  // Hide the image on error
                  const target = event.currentTarget as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
