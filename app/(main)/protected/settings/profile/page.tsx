"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import { ProfileEditor } from '@/components/shared/profile-editor';
import { SocialMediaEditor, type SocialMediaFormData } from '@/components/shared/social-media-editor';
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { ProfilePage } from "@/types";

interface ProfileData {
  handle: string;
  location: string;
}

export default function EditProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isHandleValid, setIsHandleValid] = useState(true);
  const [pages, setPages] = useState<ProfilePage[]>([]);
  const supabase = createClient();
  const router = useRouter();
  const userId = useAuthStore(state => state.userId);

  const [profileData, setProfileData] = useState<ProfileData>({
    handle: '',
    location: '',
  });

  const [originalData, setOriginalData] = useState<ProfileData>({
    handle: '',
    location: '',
  });

  const [socialMediaData, setSocialMediaData] = useState<SocialMediaFormData>({
    socialLinks: []
  });

  async function loadPages(userId: string) {
    try {
      const { data: pages, error } = await supabase
        .from('profile_pages')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPages(pages || []);
    } catch (error) {
      console.error('Error loading pages:', error);
      toast.error('Failed to load pages');
    }
  }

  async function loadUserData() {
    try {
      if (!userId) {
        router.push('/sign-in');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, handle, location, default_page_id')
        .eq('auth_user_id', userId)
        .single();

      if (profileError) throw profileError;

      await loadPages(userId);

      const { data: socialLinks } = await supabase
        .from('profile_social_links')
        .select('platform, handle')
        .eq('profile_id', profile.id);

      const userData = {
        handle: profile?.handle || '',
        location: profile?.location || '',
        defaultPageId: profile?.default_page_id || null,
      };

      console.log('userData', userData);

      setProfileData(userData);
      setOriginalData(userData);
      setSocialMediaData({ socialLinks: socialLinks || [] });
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  async function handleUpdateProfile(e: React.FormEvent) {
    console.log('handleUpdateProfile', profileData);
    e.preventDefault();
    try {
      setIsLoading(true);
      if (!userId) throw new Error('No authenticated user');

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          handle: profileData.handle,
          location: profileData.location,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', userId);

      if (profileError) throw profileError;

      toast.success('Settings updated successfully');
      setOriginalData(profileData);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateSocialMedia(data: SocialMediaFormData) {
    try {
      setIsLoading(true);
      if (!userId) throw new Error('No authenticated user');

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (error) throw error;

      await supabase
        .from('profile_social_links')
        .delete()
        .eq('profile_id', profile.id);

      if (data.socialLinks.length > 0) {
        const { error } = await supabase
          .from('profile_social_links')
          .insert(
            data.socialLinks.map(link => ({
              profile_id: profile.id,
              platform: link.platform,
              handle: link.handle,
              updated_at: new Date().toISOString()
            }))
          );

        if (error) throw error;
      }

      toast.success('Social media profiles updated successfully');
      setSocialMediaData(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update social media profiles');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Edit profile
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Update your profile information and manage your social media connections.
        </p>
      </div>

      {/* Basic Information */}
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Basic Information
        </h2>
        <div className="space-y-6">
          <ProfileEditor
            handle={profileData.handle}
            location={profileData.location}
            pages={pages}
            currentHandle={originalData.handle}
            isLoading={isLoading}
            isHandleValid={isHandleValid}
            onHandleChange={(handle) => setProfileData(prev => ({ ...prev, handle }))}
            onLocationChange={(location) => setProfileData(prev => ({ ...prev, location }))}
            onHandleValidityChange={(status) => setIsHandleValid(status.isAvailable)}
            onSubmit={handleUpdateProfile}
          />
        </div>
      </div>

      {/* Social Media Profiles */}
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Social Media Profiles
        </h2>
        <SocialMediaEditor
          initialData={socialMediaData}
          onSubmit={handleUpdateSocialMedia}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}