"use client";

import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type Bucket = "avatars" | "covers" | "content";

interface UploadOptions {
  userId?: string;
  file: File;
  bucket: Bucket;
  subfolder?: string;
}

function validateFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    throw new Error(
      "Invalid file type. Please upload a JPEG, PNG, or WebP image."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large. Maximum size is 5MB.");
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase();
  if (
    !fileExt ||
    !ALLOWED_EXTENSIONS.includes(fileExt as (typeof ALLOWED_EXTENSIONS)[number])
  ) {
    throw new Error("Invalid file extension");
  }

  return fileExt;
}

async function uploadFile({
  userId: providedUserId,
  file,
  bucket,
  subfolder,
}: UploadOptions) {
  const userId = providedUserId || useAuthStore.getState().userId;
  if (!userId) throw new Error("User ID is required");

  const fileExt = validateFile(file);
  const supabase = createClient();

  const filePath = subfolder
    ? `${userId}/${subfolder}/${Date.now()}.${fileExt}`
    : `${userId}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  if (!data?.publicUrl) throw new Error("Failed to get public URL");

  return data.publicUrl;
}

export function uploadProfileImage(file: File, userId?: string) {
  return uploadFile({ userId, file, bucket: "avatars" });
}

export function uploadCoverImage(file: File, userId?: string) {
  return uploadFile({ userId, file, bucket: "covers" });
}

export function uploadContentImage(
  file: File,
  subfolder?: string,
  userId?: string
) {
  return uploadFile({ userId, file, bucket: "content", subfolder });
}

/**
 * Fetches an image from a remote URL and uploads it to Supabase storage
 * This is useful for storing external images permanently
 */
export async function uploadRemoteImage(
  imageUrl: string,
  subfolder: string = "rcmds",
  userId?: string
): Promise<string> {
  if (!imageUrl) {
    throw new Error("No image URL provided");
  }

  try {
    console.log(`[Storage] Downloading remote image from: ${imageUrl}`);

    // Always use the proxy for external images to avoid CORS issues
    let fetchUrl = imageUrl;

    // If the URL is not already a Supabase URL (which we know works)
    if (
      !imageUrl.includes("supabase.co") &&
      !imageUrl.includes("supabase.in")
    ) {
      // Always proxy external images to avoid CORS issues
      fetchUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      console.log(`[Storage] Using proxy for this URL: ${fetchUrl}`);
    }

    // First fetch the image, with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

    try {
      // Fetch the image using our proxy API
      const response = await fetch(fetchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; RCMDBot/1.0; +https://rcmd.world)",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(
          `[Storage] Failed to fetch image: ${response.status} ${response.statusText}`
        );
        throw new Error(
          `Failed to fetch image: ${response.status} ${response.statusText}`
        );
      }

      // Get content type and validate it
      const contentType = response.headers.get("content-type");
      console.log(`[Storage] Image content type: ${contentType}`);

      // Use a default content type if none is provided
      const effectiveContentType =
        contentType && contentType.startsWith("image/")
          ? contentType
          : "image/jpeg"; // Default to JPEG if we can't determine

      // Get the file extension from content type
      let fileExt = effectiveContentType.split("/")[1].split(";")[0];

      // Normalize some common content types
      if (fileExt === "jpeg") fileExt = "jpg";
      if (fileExt === "svg+xml") fileExt = "svg";

      // If we get an unsupported extension, default to jpg
      if (
        !ALLOWED_EXTENSIONS.includes(
          fileExt as (typeof ALLOWED_EXTENSIONS)[number]
        )
      ) {
        console.warn(
          `[Storage] Unsupported image format: ${fileExt}, using jpg instead`
        );
        fileExt = "jpg";
      }

      // Convert the response to a blob
      const blob = await response.blob();
      console.log(
        `[Storage] Downloaded image size: ${(blob.size / 1024).toFixed(2)}KB`
      );

      // Check file size
      if (blob.size > MAX_FILE_SIZE) {
        console.error(
          `[Storage] Remote image too large: ${(blob.size / 1024 / 1024).toFixed(2)}MB`
        );
        throw new Error("Remote image is too large (over 5MB)");
      }

      // If the blob size is suspiciously small (< 100 bytes), it might not be a valid image
      if (blob.size < 100) {
        console.error(
          `[Storage] Suspiciously small image size (${blob.size} bytes), might be an error response`
        );
        throw new Error("Image data appears to be invalid (too small)");
      }

      // Create a File object from the blob
      const fileName = `remote_${Date.now()}.${fileExt}`;
      const file = new File([blob], fileName, { type: effectiveContentType });

      // Upload the file using our existing function
      const publicUrl = await uploadContentImage(file, subfolder, userId);
      console.log(
        `[Storage] Successfully uploaded remote image to: ${publicUrl}`
      );

      return publicUrl;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        throw new Error("Request timed out fetching remote image");
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("[Storage] Error uploading remote image:", error);
    throw error;
  }
}

export async function deleteFile(bucket: Bucket, path: string) {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) throw error;
}

/**
 * Downloads an image from a URL and uploads it to our storage
 * This is useful for social media profile images that may have restrictions
 * or limited lifetimes
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  path: string = "profile-images"
): Promise<string> {
  console.log(`[DEBUG] Downloading and uploading image from: ${imageUrl}`);

  try {
    // For the browser environment, we need to use fetch to get the image
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Convert to blob
    const blob = await response.blob();

    // Generate a filename
    const ext = blob.type.split("/")[1] || "jpg";
    const filename = `social_${Date.now()}.${ext}`;

    // Create a File object from the blob
    const file = new File([blob], filename, { type: blob.type });

    // Use our existing upload function
    console.log(`[DEBUG] Converting downloaded image to file: ${filename}`);

    // Use uploadProfileImage which handles the details for us
    const uploadedUrl = await uploadProfileImage(file);

    return uploadedUrl;
  } catch (error) {
    console.error("Error downloading and uploading image:", error);
    throw error;
  }
}
