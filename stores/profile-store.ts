"use client";

import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { ProfilePage } from "@/types";
import { devtools } from "zustand/middleware";

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
  default_page_type: string | null;
  default_page_id: string | null;
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
  lastFetchTimestamp: number;

  // Actions
  fetchProfile: (userId: string) => Promise<{ needsOnboarding?: boolean }>;
  fetchPages: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updateSocialLinks: (profileId: string, links: SocialLink[]) => Promise<void>;
  clearProfile: () => void;
  setDefaultPage: (
    profileId: string,
    defaultPageType: string,
    defaultPageId?: string
  ) => Promise<boolean>;
}

export const useProfileStore = create<ProfileState>()(
  devtools(
    (set, get) => ({
      profile: null,
      pages: [],
      socialLinks: [],
      isLoading: false,
      error: null,
      lastFetchTimestamp: 0,

      fetchProfile: async (userId: string) => {
        try {
          set({ isLoading: true, error: null });

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select(
              `
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
          location,
          default_page_type,
          default_page_id
        `
            )
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
            isLoading: false,
            lastFetchTimestamp: Date.now(),
          });

          return {};
        } catch (error) {
          const message = (error as Error).message;
          set({ error: message, isLoading: false });
          toast.error("Failed to load profile data");
          throw error;
        }
      },

      fetchPages: async (userId) => {
        set({ isLoading: true });
        try {
          // First get the profile ID from the auth user ID
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id")
            .eq("auth_user_id", userId)
            .single();

          if (profileError) throw profileError;
          if (!profileData || !profileData.id) {
            throw new Error("Profile not found");
          }

          const profileId = profileData.id;

          // Now fetch pages using the profile ID
          const { data: pages, error } = await supabase
            .from("profile_pages")
            .select("*")
            .eq("profile_id", profileId)
            .order("created_at", { ascending: true });

          if (error) throw error;

          set({ pages: pages || [] });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Error fetching pages",
          });
        } finally {
          set({ isLoading: false });
        }
      },

      updateProfile: async (updates: Partial<Profile>) => {
        try {
          set({ isLoading: true, error: null });

          const currentProfile = get().profile;
          if (!currentProfile || !currentProfile.id) {
            throw new Error("No profile loaded");
          }

          const { data, error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", currentProfile.id)
            .select()
            .single();

          if (error) throw error;

          set({
            profile: data as Profile,
            isLoading: false,
            lastFetchTimestamp: Date.now(),
          });
          toast.success("Profile updated successfully");
        } catch (error) {
          const message = (error as Error).message;
          set({ error: message, isLoading: false });
          toast.error("Failed to update profile");
          throw error;
        }
      },

      setDefaultPage: async (
        profileId: string,
        defaultPageType: string,
        defaultPageId?: string
      ) => {
        try {
          set({ isLoading: true, error: null });

          // Prepare update object
          const updates: {
            default_page_type: string;
            default_page_id?: string | null;
          } = {
            default_page_type: defaultPageType,
          };

          // Only set default_page_id if custom page type is selected
          if (defaultPageType === "custom") {
            if (!defaultPageId) {
              throw new Error("Page ID is required for custom page type");
            }
            updates.default_page_id = defaultPageId;
          } else {
            // For non-custom pages, set to null
            updates.default_page_id = null;
          }

          // Update the profile
          const { data, error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", profileId)
            .select()
            .single();

          if (error) throw error;

          // Update the store's profile state
          const currentProfile = get().profile;
          if (currentProfile && currentProfile.id === profileId) {
            const updatedProfile: Profile = {
              ...currentProfile,
              default_page_type: defaultPageType,
              default_page_id: updates.default_page_id || null,
            };
            set({
              profile: updatedProfile,
              isLoading: false,
              lastFetchTimestamp: Date.now(),
            });
          } else {
            set({ isLoading: false });
          }

          toast.success("Default page updated successfully");
          return true;
        } catch (error) {
          const message = (error as Error).message;
          set({ error: message, isLoading: false });
          toast.error("Failed to update default page");
          return false;
        }
      },

      updateSocialLinks: async (profileId, links) => {
        set({ isLoading: true });
        try {
          await supabase
            .from("profile_social_links")
            .delete()
            .eq("profile_id", profileId);

          if (links.length > 0) {
            const { error } = await supabase
              .from("profile_social_links")
              .insert(
                links.map((link) => ({
                  profile_id: profileId,
                  platform: link.platform,
                  handle: link.handle,
                  updated_at: new Date().toISOString(),
                }))
              );

            if (error) throw error;
          }

          set({ socialLinks: links });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error fetching social links",
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      clearProfile: () =>
        set(
          {
            profile: null,
            socialLinks: [],
            pages: [],
            isLoading: false,
            error: null,
            lastFetchTimestamp: 0,
          },
          false,
          "profile/clear"
        ),
    }),

    {
      name: "ProfileStore",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);
