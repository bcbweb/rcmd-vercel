"use client";

import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { ProfilePage } from "@/types";
import { devtools, persist } from "zustand/middleware";
import { ensureUserProfile } from "@/utils/profile-utils";

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
  fetchAttempts: number;
  initialized: boolean;

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
  retryFetch: (userId: string) => Promise<void>;
  setServerProfile: (profile: Profile, socialLinks?: SocialLink[]) => void;
}

export const useProfileStore = create<ProfileState>()(
  devtools(
    persist(
      (set, get) => ({
        profile: null,
        pages: [],
        socialLinks: [],
        isLoading: false,
        error: null,
        lastFetchTimestamp: 0,
        fetchAttempts: 0,
        initialized: false,

        fetchProfile: async (userId: string) => {
          try {
            const { fetchAttempts, lastFetchTimestamp } = get();
            const now = Date.now();

            // Debounce if called multiple times in quick succession
            const state = get();
            if (state.isLoading && now - lastFetchTimestamp < 2000) {
              console.log("Debouncing profile fetch, already in progress");
              return {};
            }

            set({
              isLoading: true,
              error: null,
              fetchAttempts: fetchAttempts + 1,
            });

            console.log(
              `Fetching profile for user ${userId} (attempt ${fetchAttempts + 1})`,
              { state: JSON.stringify(state) }
            );

            // Start with a short delay to ensure auth state is fully set
            await new Promise((resolve) => setTimeout(resolve, 500));

            const supabase = createClient();

            // First, try to get the active profile from user_active_profiles
            let activeProfileId: string | null = null;
            const { data: activeProfile } = await supabase
              .from("user_active_profiles")
              .select("profile_id")
              .eq("auth_user_id", userId)
              .single();

            if (activeProfile) {
              activeProfileId = activeProfile.profile_id;
              console.log("Found active profile:", activeProfileId);
            } else {
              // If no active profile is set, get the first profile or create one
              const { data: profiles } = await supabase
                .from("profiles")
                .select("id")
                .eq("auth_user_id", userId)
                .order("created_at", { ascending: true })
                .limit(1);

              if (profiles && profiles.length > 0) {
                activeProfileId = profiles[0].id;
                // Set it as active
                await supabase.rpc("set_active_profile", {
                  p_profile_id: activeProfileId,
                });
                console.log("Set first profile as active:", activeProfileId);
              } else {
                // Ensure a profile exists for this user
                const profileId = await ensureUserProfile(userId);
                if (!profileId) {
                  throw new Error("Failed to ensure profile exists");
                }
                activeProfileId = profileId;
                // Set it as active
                await supabase.rpc("set_active_profile", {
                  p_profile_id: profileId,
                });
                console.log("Created and set new profile as active:", profileId);
              }
            }

            // Fetch the active profile
            console.log("Querying profiles table for profile_id:", activeProfileId);
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
              .eq("id", activeProfileId)
              .single();

            if (profileError) {
              console.error("Profile query error:", profileError);
              throw profileError;
            }

            // If we found a profile, log the ID
            if (profile) {
              console.log(
                `Found profile with ID: ${profile.id} for auth user: ${userId}`
              );
            } else {
              console.log(`No profile found for auth user: ${userId}`);
            }

            // Return early if no profile or not onboarded
            if (!profile || !profile.is_onboarded) {
              console.log(
                `Profile not found or not onboarded: ${profile?.is_onboarded}`
              );
              set({
                isLoading: false,
                initialized: true,
              });
              return { needsOnboarding: true };
            }

            console.log(
              `Profile is onboarded, fetching social links for profile ID: ${profile.id}`
            );

            // Fetch social links
            const { data: socialLinks, error: socialLinksError } =
              await supabase
                .from("profile_social_links")
                .select("platform, handle")
                .eq("profile_id", profile.id);

            if (socialLinksError) {
              console.error("Social links error:", socialLinksError);
              throw socialLinksError;
            }

            console.log(`Found ${socialLinks?.length || 0} social links`);

            set({
              profile,
              socialLinks: socialLinks || [],
              isLoading: false,
              lastFetchTimestamp: now,
              initialized: true,
              fetchAttempts: 0, // Reset attempts on success
            });

            console.log("Profile fetched successfully", profile.id);
            return {};
          } catch (error) {
            const message = (error as Error).message;
            console.error("Profile fetch error:", message, error);

            set({
              error: message,
              isLoading: false,
              initialized: true, // Mark as initialized even on error
            });

            // Only show toast on non-initial load errors to avoid disrupting initialization
            if (get().fetchAttempts > 1) {
              toast.error("Failed to load profile data");
            }
            return {};
          }
        },

        retryFetch: async (userId: string) => {
          const { fetchAttempts } = get();
          if (fetchAttempts > 5) {
            set({ error: "Too many retry attempts" });
            return;
          }

          console.log("Retrying profile fetch");
          await get().fetchProfile(userId);
        },

        fetchPages: async (userId) => {
          set({ isLoading: true });
          try {
            const supabase = createClient();

            // Ensure a profile exists for this user
            const profileId = await ensureUserProfile(userId);
            if (!profileId) {
              throw new Error("Failed to ensure profile exists");
            }

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
            const supabase = createClient();

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
            const supabase = createClient();

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

        updateSocialLinks: async (profileId: string, links: SocialLink[]) => {
          try {
            set({ isLoading: true, error: null });
            const supabase = createClient();

            // First, remove all existing links
            const { error: deleteError } = await supabase
              .from("profile_social_links")
              .delete()
              .eq("profile_id", profileId);

            if (deleteError) throw deleteError;

            // Then, insert the new links if there are any
            if (links.length > 0) {
              const mappedLinks = links.map((link) => ({
                ...link,
                profile_id: profileId,
              }));

              const { error: insertError } = await supabase
                .from("profile_social_links")
                .insert(mappedLinks);

              if (insertError) throw insertError;
            }

            set({
              socialLinks: links,
              isLoading: false,
              lastFetchTimestamp: Date.now(),
            });

            toast.success("Social links updated successfully");
          } catch (error) {
            const message = (error as Error).message;
            set({ error: message, isLoading: false });
            toast.error("Failed to update social links");
            throw error;
          }
        },

        clearProfile: () => {
          set({
            profile: null,
            socialLinks: [],
            isLoading: false,
            error: null,
            lastFetchTimestamp: 0,
            fetchAttempts: 0,
            initialized: false,
          });
        },

        setServerProfile: (profile: Profile, socialLinks?: SocialLink[]) => {
          set({
            profile,
            socialLinks: socialLinks || [],
            isLoading: false,
            error: null,
            lastFetchTimestamp: Date.now(),
            fetchAttempts: 0,
            initialized: true,
          });
        },
      }),
      {
        name: "profile-storage",
      }
    ),
    { name: "Profile Store" }
  )
);
