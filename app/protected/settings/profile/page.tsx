"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import { ProfileEditor } from '@/components/shared/profile-editor';
import { SocialMediaEditor, type SocialMediaFormData } from '@/components/shared/social-media-editor';
import router from "next/router";

interface ProfileData {
  handle: string;
  location: string;
}

export default function EditProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isHandleValid, setIsHandleValid] = useState(true);
  const supabase = createClient();

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

  async function loadUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/sign-in');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, handle, location')
        .eq('auth_user_id', user.id)
        .single();

      if (error) throw error;

      const { data: socialLinks } = await supabase
        .from('profile_social_links')
        .select('platform, handle')
        .eq('profile_id', profile.id);

      const userData = {
        handle: profile?.handle || '',
        location: profile?.location || '',
        email: user.email || '',
      };

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
    loadUserData();
  }, []);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          handle: profileData.handle,
          location: profileData.location,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', user.id);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (error) throw error;

      // Delete existing links
      await supabase
        .from('profile_social_links')
        .delete()
        .eq('profile_id', profile.id);

      // Insert new links
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
        <ProfileEditor
          handle={profileData.handle}
          location={profileData.location}
          currentHandle={originalData.handle}
          isLoading={isLoading}
          isHandleValid={isHandleValid}
          onHandleChange={(handle) => setProfileData(prev => ({ ...prev, handle }))}
          onLocationChange={(location) => setProfileData(prev => ({ ...prev, location }))}
          onHandleValidityChange={(status) => setIsHandleValid(status.isAvailable)}
          onSubmit={handleUpdateProfile}
        />
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