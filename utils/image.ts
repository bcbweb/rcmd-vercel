export const getImageUrl = (
  url: string | null | undefined
): string | undefined => {
  if (!url) return undefined;

  // Check if the URL is from Supabase storage
  if (url.includes("supabase.co/storage")) {
    // Return the original URL without Next.js Image optimization
    return url;
  }

  // For other URLs, let Next.js handle the optimization
  return url;
};

export const imageLoader = ({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) => {
  // If it's a Supabase storage URL, return it as is
  if (src.includes("supabase.co/storage")) {
    return src;
  }

  // Otherwise, let Next.js handle the image optimization
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
};
