import { createClient } from '@/utils/supabase/client';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type Bucket = 'avatars' | 'covers' | 'content';

interface UploadOptions {
  userId: string;
  file: File;
  bucket: Bucket;
  subfolder?: string;
}

function validateFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase();
  if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt as typeof ALLOWED_EXTENSIONS[number])) {
    throw new Error('Invalid file extension');
  }

  return fileExt;
}

async function uploadFile({ userId, file, bucket, subfolder }: UploadOptions) {
  if (!userId) throw new Error('User ID is required');

  const fileExt = validateFile(file);
  const supabase = createClient();

  const filePath = subfolder
    ? `${userId}/${subfolder}/${Date.now()}.${fileExt}`
    : `${userId}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
}

export function uploadProfileImage(file: File, userId: string) {
  return uploadFile({ userId, file, bucket: 'avatars' });
}

export function uploadCoverImage(file: File, userId: string) {
  return uploadFile({ userId, file, bucket: 'covers' });
}

export function uploadContentImage(file: File, userId: string, subfolder?: string) {
  return uploadFile({ userId, file, bucket: 'content', subfolder });
}

export async function deleteFile(bucket: Bucket, path: string) {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) throw error;
}