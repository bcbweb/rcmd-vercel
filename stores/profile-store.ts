'use client';

import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { ProfilePage } from '@/types';
import { devtools } from 'zustand/middleware';

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
  pages: ProfilePage[];
  socialLinks: SocialLink[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: (userId: string) => Promise<{ needsOnboarding?: boolean; }>;
  fetchPages: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updateSocialLinks: (profileId: string, links: SocialLink[]) => Promise<void>;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  devtools(
    (set, get) => ({
      profile: null,
      pages: [],
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

      fetchPages: async (userId) => {
        set({ isLoading: true });
        try {
          const { data: pages, error } = await supabase
            .from('profile_pages')
            .select('*')
            .eq('profile_id', userId)
            .order('created_at', { ascending: true });

          if (error) throw error;
          set({ pages: pages || [] });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Error fetching pages' });
        } finally {
          set({ isLoading: false });
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

      updateSocialLinks: async (profileId, links) => {
        set({ isLoading: true });
        try {
          await supabase.from('profile_social_links').delete().eq('profile_id', profileId);

          if (links.length > 0) {
            const { error } = await supabase.from('profile_social_links').insert(
              links.map(link => ({
                profile_id: profileId,
                platform: link.platform,
                handle: link.handle,
                updated_at: new Date().toISOString()
              }))
            );

            if (error) throw error;
          }

          set({ socialLinks: links });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Error fetching social links' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      clearProfile: () => set({
        profile: null,
        socialLinks: [],
        pages: [],
        isLoading: false,
        error: null
      }, false, 'profile/clear'),
    }),

    {
      name: 'ProfileStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);