"use client";

import Image from "next/image";
import { useState } from "react";

interface MetadataPreviewImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
}

/**
 * A component for displaying metadata preview images that handles errors,
 * proxying of external images when needed, and uses Next.js <Image> component
 * for all image rendering with appropriate configuration.
 */
export function MetadataPreviewImage({
  src,
  alt,
  fallbackSrc,
  width = 300,
  height = 200,
  className,
  fill = false,
}: MetadataPreviewImageProps) {
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  const shouldProxy = (url: string) => {
    if (!url) return false;
    try {
      const parsedUrl = new URL(url);
      // Skip proxying for our own domain or already proxied images
      return (
        !parsedUrl.hostname.includes("rcmd.app") &&
        !parsedUrl.hostname.includes("supabase") &&
        !parsedUrl.toString().includes("imagedelivery.net")
      );
    } catch {
      return false;
    }
  };

  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 1; // Try once with proxy, then fallback to direct

  const currentSrc = error && fallbackSrc ? fallbackSrc : imageSrc;
  const useProxy = shouldProxy(imageSrc) && retryCount === 0;

  const handleError = () => {
    // If proxy failed and we haven't retried, try direct URL
    if (useProxy && retryCount < MAX_RETRIES) {
      setRetryCount(retryCount + 1);
      // Reset error state to allow retry
      setError(false);
      return;
    }

    // If we've retried or no proxy was used, use fallback if available
    if (fallbackSrc && !error) {
      setError(true);
      setImageSrc(fallbackSrc);
    } else if (!fallbackSrc) {
      // No fallback, just mark as error
      setError(true);
    }
  };

  // Use proxy for external images, but allow fallback to direct URL
  const finalSrc = useProxy
    ? `/api/proxy-image?url=${encodeURIComponent(imageSrc)}`
    : currentSrc;

  // Custom loader for external images
  const customLoader = ({ src }: { src: string }) => {
    return src;
  };

  // Use fill layout or fixed dimensions
  if (fill) {
    return (
      <div className={`relative h-full w-full ${className || ""}`}>
        {error && !fallbackSrc ? (
          <div className="flex items-center justify-center h-full w-full bg-gray-100 dark:bg-gray-700">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        ) : (
          <Image
            src={finalSrc}
            alt={alt}
            className={className}
            fill={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={handleError}
            loader={customLoader}
            unoptimized={useProxy}
          />
        )}
      </div>
    );
  }

  return error && !fallbackSrc ? (
    <div
      className={`flex items-center justify-center bg-gray-100 dark:bg-gray-700 ${className || ""}`}
      style={{ width, height }}
    >
      <svg
        className="w-12 h-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  ) : (
    <Image
      src={finalSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      loader={customLoader}
      unoptimized={useProxy}
    />
  );
}

// Add default export for better compatibility
export default MetadataPreviewImage;
