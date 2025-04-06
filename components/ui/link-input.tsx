"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";
import punycode from "punycode";

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

interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  type?: string;
  url?: string;
}

export default function LinkInput({
  value = "",
  onChange,
  onMetadataFetch,
  disabled = false,
  onClear,
  placeholder = "Enter URL...",
  className = "",
  hidePreview = false,
}: LinkInputProps) {
  const [isValid, setIsValid] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);

  // Use useMemo for the regex
  const urlRegex = useMemo(
    () => /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    []
  );

  // Define fetch metadata function with useCallback
  const fetchMetadata = useCallback(async () => {
    if (!value) return;

    // Skip if not a valid URL
    if (!urlRegex.test(value)) {
      setIsFetching(false);
      return;
    }

    try {
      // You'll need to implement this API endpoint
      const response = await fetch(
        `/api/metadata?url=${encodeURIComponent(value)}`
      );

      if (!response.ok) {
        throw new Error(`Error fetching metadata: ${response.status}`);
      }

      const data = await response.json();
      setMetadata(data);

      if (onMetadataFetch) {
        onMetadataFetch(data);
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
    } finally {
      setIsFetching(false);
    }
  }, [value, urlRegex, onMetadataFetch]);

  // Fetch metadata when url changes
  useEffect(() => {
    if (
      value &&
      !isFetching &&
      value !== metadata?.url &&
      urlRegex.test(value)
    ) {
      setIsFetching(true);
      fetchMetadata();
    }
  }, [value, isFetching, metadata?.url, urlRegex, fetchMetadata]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    onChange(url);
    setIsValid(urlRegex.test(url));
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        {/* URL Input */}
        <div className="relative flex items-center">
          <input
            type="url"
            value={value}
            onChange={handleChange}
            disabled={disabled}
            placeholder={placeholder}
            className={`
              w-full p-2 pl-10 border rounded-md 
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${isValid ? "border-gray-300" : "border-red-500"}
              ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
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
                  ? (() => {
                      try {
                        const url = new URL(
                          value.startsWith("http") ? value : `https://${value}`
                        );
                        // Use punycode to handle potential IDNs (international domain names)
                        return punycode.toASCII(url.hostname);
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
              <Image
                src={metadata.image}
                alt="Link preview"
                width={80}
                height={80}
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
