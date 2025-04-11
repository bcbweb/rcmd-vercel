import { urlFor } from "@/lib/sanity";

/**
 * Utility functions for handling Sanity images consistently across the app
 */

// Define types for Sanity image references in various formats
export type SanityImageAsset = {
  _type: "reference";
  _ref: string;
};

export type SanityImageSource = {
  _type?: string;
  asset: SanityImageAsset;
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
};

export type AnySanityImage =
  | SanityImageSource
  | { _ref?: string; url?: string; [key: string]: any }
  | string
  | null
  | undefined;

// Valid image formats
type ImageFormat = "jpg" | "jpeg" | "png" | "webp" | "gif";

/**
 * Get a valid image URL from any Sanity image reference
 *
 * @param image Any format of Sanity image reference
 * @param options Options for the image (width, crop, etc)
 * @returns A valid URL string or empty string if invalid
 */
export function getSanityImageUrl(
  image: AnySanityImage,
  options: { width?: number; height?: number; format?: ImageFormat } = {}
): string {
  if (!image) return "";

  try {
    const builder = urlFor(image);

    // Handle string result (direct URL)
    if (typeof builder === "string") {
      return builder;
    }

    // Apply options to builder
    let imageBuilder = builder;

    if (options.width && typeof imageBuilder.width === "function") {
      imageBuilder = imageBuilder.width(options.width);
    }

    if (options.height && typeof imageBuilder.height === "function") {
      imageBuilder = imageBuilder.height(options.height);
    }

    if (options.format && typeof imageBuilder.format === "function") {
      imageBuilder = imageBuilder.format(options.format);
    }

    // Auto format is usually good for optimization
    if (typeof imageBuilder.auto === "function") {
      imageBuilder = imageBuilder.auto("format");
    }

    // Get the URL
    return typeof imageBuilder.url === "function"
      ? imageBuilder.url()
      : String(imageBuilder);
  } catch (error) {
    console.error("Error getting Sanity image URL:", error);
    return "";
  }
}

/**
 * Check if a value is a valid Sanity image reference
 */
export function isSanityImage(value: any): boolean {
  if (!value) return false;

  // Check for common Sanity image patterns
  if (typeof value === "string" && value.includes("cdn.sanity.io")) {
    return true;
  }

  if (typeof value === "object" && value !== null) {
    // Check for asset._ref pattern
    if (
      value.asset &&
      value.asset._ref &&
      typeof value.asset._ref === "string"
    ) {
      return true;
    }

    // Check for direct _ref pattern
    if (
      value._ref &&
      typeof value._ref === "string" &&
      value._ref.includes("image-")
    ) {
      return true;
    }

    // Check for URL pattern
    if (
      value.url &&
      typeof value.url === "string" &&
      value.url.includes("cdn.sanity.io")
    ) {
      return true;
    }
  }

  return false;
}
