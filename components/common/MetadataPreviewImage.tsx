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

  const handleError = () => {
    if (fallbackSrc && !error) {
      setError(true);
      setImageSrc(fallbackSrc);
    }
  };

  const currentSrc = error && fallbackSrc ? fallbackSrc : imageSrc;

  // Use proxy for external images
  const finalSrc = shouldProxy(currentSrc)
    ? `/api/proxy-image?url=${encodeURIComponent(currentSrc)}`
    : currentSrc;

  // Custom loader for external images
  const customLoader = ({ src }: { src: string }) => {
    return src;
  };

  // Use fill layout or fixed dimensions
  if (fill) {
    return (
      <div className={`relative h-full w-full ${className || ""}`}>
        <Image
          src={finalSrc}
          alt={alt}
          className={className}
          fill={true}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={handleError}
          loader={customLoader}
          unoptimized={shouldProxy(currentSrc)}
        />
      </div>
    );
  }

  return (
    <Image
      src={finalSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      loader={customLoader}
      unoptimized={shouldProxy(currentSrc)}
    />
  );
}

// Add default export for better compatibility
export default MetadataPreviewImage;
