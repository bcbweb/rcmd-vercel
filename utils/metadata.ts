/**
 * Utility to provide a consistent metadataBase configuration
 * that can be reused across the application.
 */

// Determine the base URL for metadata and Open Graph/Twitter images
export const getMetadataBase = () => {
  const metadataBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    (process.env.NEXT_PUBLIC_VERCEL_URL &&
      `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`) ||
    "https://rcmd.app";

  return new URL(metadataBaseUrl);
};
