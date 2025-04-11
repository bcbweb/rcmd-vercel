import Image, { ImageProps } from "next/image";
import { useMemo } from "react";
import { AnySanityImage, getSanityImageUrl } from "@/utils/image-utils";

// Import or recreate the ImageFormat type
type ImageFormat = "jpg" | "jpeg" | "png" | "webp" | "gif";

// We're now using the AnySanityImage type from utils/image-utils.ts

interface SanityImageProps extends Omit<ImageProps, "src"> {
  image: AnySanityImage;
  width?: number;
  height?: number;
  format?: ImageFormat;
  fallbackUrl?: string;
}

/**
 * Component for rendering Sanity images with proper error handling
 * Works with any format of Sanity image reference
 */
export default function SanityImage({
  image,
  alt,
  width,
  height,
  format,
  fallbackUrl = "/images/default-image.jpg",
  ...props
}: SanityImageProps) {
  // Get image URL with proper error handling
  const imageUrl = useMemo(() => {
    const url = getSanityImageUrl(image, { width, height, format });
    return url || fallbackUrl;
  }, [image, width, height, format, fallbackUrl]);

  // Don't render anything if no URL and no fallback
  if (!imageUrl) return null;

  return (
    <Image
      src={imageUrl}
      alt={alt || "Image"}
      width={props.fill ? undefined : width || 800}
      height={props.fill ? undefined : height || 600}
      {...props}
    />
  );
}
