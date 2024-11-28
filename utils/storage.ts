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

  if (error) throw error;
  return supabase.storage.from('covers').getPublicUrl(fileName).data.publicUrl;
}

export async function uploadContentImage(file: File, userId: string, subfolder?: string) {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
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