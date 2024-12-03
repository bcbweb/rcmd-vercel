import { createClient } from '@/utils/supabase/client';

export async function uploadProfileImage(file: File, userId: string) {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;
  return supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
}

export async function uploadCoverImage(file: File, userId: string) {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('covers')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Error uploading cover image with response: ', data);
    throw error;
  }
  return supabase.storage.from('covers').getPublicUrl(fileName).data.publicUrl;
}

export async function uploadContentImage(file: File, userId: string, subfolder?: string) {
  if (!userId) throw new Error('User ID is required');

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  const supabase = createClient();
  const fileExt = file.name.split('.').pop()?.toLowerCase();

  if (!fileExt || !['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
    throw new Error('Invalid file extension');
  }

  // Ensure consistent path structure: userId/subfolder/filename
  const filePath = subfolder
    ? `${userId}/${subfolder}/${Date.now()}.${fileExt}`
    : `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('content')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;
  return supabase.storage.from('content').getPublicUrl(filePath).data.publicUrl;
}

export async function deleteFile(bucket: 'avatars' | 'covers' | 'content', path: string) {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) throw error;
}