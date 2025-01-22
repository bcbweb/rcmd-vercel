'use client';

import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

const supabase = createClient();

interface Profile {
  id: string;
  is_onboarded: boolean;
  first_name: string | null;
  last_name: string | null;
  handle: string | null;
  profile_picture_url: string | null;
  cover_image: string | null;
  interests: string[] | null;
  tags: string[] | null;
  bio: string | null;
  location: string | null;
}

interface SocialLink {
  platform: string;
  handle: string;
}

interface ProfileState {
  profile: Profile | null;
  socialLinks: SocialLink[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: (userId: string) => Promise<{ needsOnboarding?: boolean; }>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updateSocialLinks: (links: SocialLink[]) => Promise<void>;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  socialLinks: [],
  isLoading: false,
  error: null,

  fetchProfile: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(`
          id,
          is_onboarded,
          first_name,
          last_name,
          handle,
          profile_picture_url,
          cover_image,
          interests,
          tags,
          bio,
          location
        `)
        .eq("auth_user_id", userId)
        .single();

      if (profileError) throw profileError;

      // Return early if no profile or not onboarded
      if (!profile || !profile.is_onboarded) {
        set({ isLoading: false });
        return { needsOnboarding: true };
      }

      // Fetch social links
      const { data: socialLinks, error: socialLinksError } = await supabase
        .from("profile_social_links")
        .select("platform, handle")
        .eq("profile_id", profile.id);

      if (socialLinksError) throw socialLinksError;

      set({
        profile,
        socialLinks: socialLinks || [],
        isLoading: false
      });

      return {};
    } catch (error) {
      const message = (error as Error).message;
      set({ error: message, isLoading: false });
      toast.error('Failed to load profile data');
      throw error;
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", get().profile?.id)
        .select()
        .single();

      if (error) throw error;

      set({ profile: data, isLoading: false });
      toast.success('Profile updated successfully');
    } catch (error) {
      const message = (error as Error).message;
      set({ error: message, isLoading: false });
      toast.error('Failed to update profile');
      throw error;
    }
  },

  updateSocialLinks: async (links: SocialLink[]) => {
    try {
      set({ isLoading: true, error: null });

      // Delete existing links
      await supabase
        .from("profile_social_links")
        .delete()
        .eq("profile_id", get().profile?.id);

      // Insert new links
      if (links.length > 0) {
        const { error } = await supabase
          .from("profile_social_links")
          .insert(links.map(link => ({
            profile_id: get().profile?.id,
            ...link
          })));

        if (error) throw error;
      }

      set({ socialLinks: links, isLoading: false });
      toast.success('Social links updated successfully');
    } catch (error) {
      const message = (error as Error).message;
      set({ error: message, isLoading: false });
      toast.error('Failed to update social links');
      throw error;
    }
  },

  reset: () => {
    set({
      profile: null,
      socialLinks: [],
      isLoading: false,
      error: null
    });
  }
}));