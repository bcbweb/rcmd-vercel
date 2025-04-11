import Image from "next/image";
import { useState } from "react";

interface MetadataPreviewImageProps {
  src: string;
  alt?: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
}

/**
 * A component for safely displaying external images in metadata previews
 * Handles errors and provides fallbacks
 */
export default function MetadataPreviewImage({
  src,
  alt = "Preview image",
  fallbackSrc = "/images/default-preview.jpg",
  width = 800,
  height = 600,
  className = "",
  fill = false,
  ...props
}: MetadataPreviewImageProps) {
  const [error, setError] = useState(false);

  // Use proxy for images that might be problematic
  const shouldProxyImage = (url: string): boolean => {
    if (!url) return false;

    // Check if the URL is already from a known safe domain
    // Only trust our own domains and services
    const safeDomainsRegex = /(supabase\.co|vercel\.app|cdn\.sanity\.io)/i;
    if (safeDomainsRegex.test(url)) return false;

    // Internal URLs don't need proxying
    if (url.startsWith("/")) return false;

    // For external domains, proxy those with special characters
    // or any that aren't explicitly allowed in Next.js config
    return (
      url.includes("*") ||
      url.includes("@") ||
      url.includes("+") ||
      url.includes("%") ||
      !url.match(/^https?:\/\/([^/]+)/)?.[1].includes(".")
    );
  };

  // Choose the right src
  const getImageSrc = () => {
    if (error || !src) return fallbackSrc;

    if (shouldProxyImage(src)) {
      return `/api/proxy-image?url=${encodeURIComponent(src)}`;
    }

    return src;
  };

  const imageSrc = getImageSrc();

  // Use regular img tag for certain cases to bypass Next.js image restrictions
  const shouldUseImgTag = () => {
    // If it's already a proxied or fallback image, use Next Image
    if (imageSrc.startsWith("/api/") || imageSrc === fallbackSrc) return false;

    // Internal URLs can use Next.js Image
    if (imageSrc.startsWith("/")) return false;

    // For external URLs, use regular img tag unless explicitly allowed in Next.js config
    // This is the most reliable approach for arbitrary domains
    return !imageSrc.match(/(supabase\.co|cdn\.sanity\.io)/i);
  };

  if (shouldUseImgTag()) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{ aspectRatio: fill ? "auto" : `${width}/${height}` }}
      >
        <img
          src={imageSrc}
          alt={alt}
          className={`${fill ? "absolute inset-0 w-full h-full" : "w-full h-auto"} object-cover`}
          onError={() => setError(true)}
        />
      </div>
    );
  }

  // Use Next.js Image for our own domains or proxied images
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={imageSrc}
        alt={alt}
        {...(fill ? { fill: true } : { width: width, height: height })}
        className="object-cover"
        onError={() => setError(true)}
        {...props}
      />
    </div>
  );
}
