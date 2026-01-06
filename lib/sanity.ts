import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";

// Define a type for Sanity image sources
type SanityImageSource = {
  _type: string;
  asset: {
    _ref: string;
    _type: string;
  };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
};

// Extended type to include other possible Sanity image formats
type ExtendedSanityImageSource =
  | SanityImageSource
  | {
      _ref?: string;
      url?: string;
      [key: string]: any;
    };

// Source type that can be passed to urlFor function
type SanityImageValue =
  | ExtendedSanityImageSource
  | string
  | Record<string, unknown>
  | null
  | undefined;

// Use fallback values from the sanity.config.js if environment variables are not available
// This ensures the build process can still access Sanity even if env vars aren't set
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "ce6vefd3";

// Get dataset from environment variable - be explicit to avoid concatenation issues
// The error shows dataset was concatenated with other env vars, so we need to be very careful
const datasetEnv = process.env.NEXT_PUBLIC_SANITY_DATASET;
let dataset: string;

if (
  datasetEnv &&
  typeof datasetEnv === "string" &&
  datasetEnv.trim().length > 0
) {
  // Extract only the valid dataset name part (before any concatenation)
  // Common valid dataset names: production, development, staging, etc.
  // Match only the first valid dataset-like string (lowercase, alphanumeric, underscores, dashes)
  const match = datasetEnv.match(/^([a-z0-9_-]{1,64})/i);
  if (match && match[1]) {
    dataset = match[1].toLowerCase();
    // Ensure it's a reasonable dataset name (not too short, not just numbers)
    if (dataset.length < 2 || /^\d+$/.test(dataset)) {
      dataset = "production";
    }
  } else {
    dataset = "production";
  }
} else {
  // Default to production if env var is missing or invalid
  dataset = "production";
}

// Final validation: ensure dataset is valid Sanity dataset format
dataset = dataset
  .toLowerCase()
  .replace(/[^a-z0-9_-]/g, "")
  .substring(0, 64);
if (!dataset || dataset.length === 0) {
  dataset = "production";
}

export const client = createClient({
  projectId,
  dataset,
  apiVersion: "2023-10-10",
  useCdn: process.env.NODE_ENV === "production",
});

// Helper function for generating image URLs
const builder = imageUrlBuilder(client);

// Helper function to check if an object has a specific property
function hasProperty<K extends string>(
  obj: unknown,
  prop: K
): obj is Record<K, unknown> {
  return obj !== null && typeof obj === "object" && prop in obj;
}

/**
 * Enhanced function for handling Sanity image URLs
 * Adds better error handling and direct URL generation for any Sanity image
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function urlFor(source: SanityImageValue) {
  // Return empty string if source is null or undefined
  if (!source) return "";

  try {
    // Use Sanity's built-in image URL builder
    return builder.image(source).auto("format");
  } catch (error) {
    console.error("Error creating Sanity image URL:", error);

    // Attempt to extract direct URL as fallback
    try {
      // Handle different possible source formats
      if (typeof source === "string") {
        // If already a direct URL to Sanity CDN
        if (source.includes("cdn.sanity.io")) {
          return source;
        }
        // Could be a direct ref
        if (source.startsWith("image-")) {
          return extractSanityImageUrl(source);
        }
        // Return as is - might be a regular URL
        return source;
      }

      // Type guards for property access
      if (typeof source === "object" && source !== null) {
        // Handle asset reference format (most common)
        if (
          hasProperty(source, "asset") &&
          hasProperty(source.asset, "_ref") &&
          typeof source.asset._ref === "string"
        ) {
          return extractSanityImageUrl(source.asset._ref);
        }

        // Handle direct _ref format
        if (hasProperty(source, "_ref") && typeof source._ref === "string") {
          return extractSanityImageUrl(source._ref);
        }

        // Handle URL field if present
        if (hasProperty(source, "url") && typeof source.url === "string") {
          return source.url;
        }
      }
    } catch (fallbackError) {
      console.error("Fallback URL creation failed:", fallbackError);
    }

    // Return empty string if all attempts fail
    return "";
  }
}

/**
 * Extract a direct Sanity CDN URL from an asset reference
 */
function extractSanityImageUrl(ref: string): string {
  if (!ref) return "";

  try {
    // Handle different reference formats
    // Format: image-{id}-{dimensions}.{ext}
    const refParts = ref.split("-");

    // Basic validation
    if (refParts.length < 2 || !ref.includes("image-")) {
      return "";
    }

    // Extract the ID (everything between 'image-' and the last dash)
    const id = refParts.slice(1, -1).join("-");

    // Get the dimension and extension part (last section of the reference)
    const dimensionAndExtPart = refParts[refParts.length - 1];

    // Split by dot to separate dimensions from extension
    const [dimensions, fileExtTemp] = dimensionAndExtPart.split(".");

    // Determine file extension
    const fileExt = fileExtTemp || getImageExtension(ref);

    // Construct direct URL to Sanity CDN
    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dimensions}.${fileExt}`;
  } catch (error) {
    console.error("Error extracting Sanity image URL:", error);
    return "";
  }
}

/**
 * Helper function to determine image extension from asset reference
 */
function getImageExtension(ref: string): string {
  // Default to png if we can't determine
  if (!ref) return "png";

  // Check for known extensions in the reference
  if (ref.includes("png")) return "png";
  if (ref.includes("jpg") || ref.includes("jpeg")) return "jpg";
  if (ref.includes("webp")) return "webp";
  if (ref.includes("gif")) return "gif";
  if (ref.includes("svg")) return "svg";

  // Default fallback
  return "png";
}

// Helper functions for fetching data
export async function getRCMDs() {
  return client.fetch(`*[_type == "rcmd"]`);
}

export async function getRCMDBySlug(slug: string) {
  return client.fetch(`*[_type == "rcmd" && slug.current == $slug][0]`, {
    slug,
  });
}

export async function getCollections() {
  return client.fetch(`*[_type == "collection"]`);
}

export async function getCollectionBySlug(slug: string) {
  return client.fetch(`*[_type == "collection" && slug.current == $slug][0]`, {
    slug,
  });
}

export async function getCategories() {
  return client.fetch(`*[_type == "category"]`);
}

export async function getHomepage() {
  return client.fetch(`*[_type == "homepage"][0]`);
}
