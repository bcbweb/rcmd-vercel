"use client";

import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import type { RCMD } from "@/types";

interface RCMDStore {
  rcmds: RCMD[];
  isLoading: boolean;
  error: string | null;
  insertRCMD: (
    title: string,
    description: string,
    type: string,
    visibility: string,
    imageUrl?: string,
    tags?: string[],
    url?: string,
    location?: {
      placeId: string;
      address: string;
      coordinates?: {
        lat?: number;
        lng?: number;
      };
    },
    profile_id?: string
  ) => Promise<RCMD | null>;
  fetchRCMDs: (userId?: string) => Promise<void>;
  deleteRCMD: (id: string) => Promise<void>;
  updateRCMD: (id: string, updates: Partial<RCMD>) => Promise<void>;
}

export const useRCMDStore = create<RCMDStore>((set, get) => ({
  rcmds: [],
  isLoading: false,
  error: null,

  insertRCMD: async (
    title: string,
    description: string,
    type: string,
    visibility: string,
    imageUrl?: string,
    tags: string[] = [],
    url?: string,
    location?: {
      placeId: string;
      address: string;
      coordinates?: {
        lat?: number;
        lng?: number;
      };
    },
    profile_id?: string
  ) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const locationData = location
        ? {
            placeId: location.placeId,
            address: location.address,
            coordinates: location.coordinates,
          }
        : null;

      const { data, error } = await supabase.rpc("insert_rcmd_v2", {
        p_title: title,
        p_description: description,
        p_type: type,
        p_visibility: visibility,
        p_featured_image: imageUrl,
        p_tags: tags,
        p_url: url,
        p_location: locationData,
        p_profile_id: profile_id,
      });

      if (error) throw error;

      set((state) => ({
        rcmds: [data[0] as RCMD, ...state.rcmds],
        isLoading: false,
      }));

      return data[0] as RCMD;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to insert RCMD";
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  fetchRCMDs: async (userId?: string) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      let query = supabase
        .from("rcmds")
        .select("*")
        .order("created_at", { ascending: false });

      if (userId) {
        // Support both profile_id and legacy owner_id
        query = query.or(`profile_id.eq.${userId},owner_id.eq.${userId}`);
      } else {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error("No user found");

        // First try to find profile_id from profiles table
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();

        if (profileData && profileData.id) {
          // If profile exists, use profile_id
          console.log("Using profile_id for RCMDs query:", profileData.id);
          query = query.eq("profile_id", profileData.id);
        } else {
          // Fall back to owner_id for backward compatibility
          console.log("No profile found, falling back to owner_id:", user.id);
          query = query.eq("owner_id", user.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log(`Found ${data?.length || 0} RCMDs`);
      set({ rcmds: data || [], isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch RCMDs";
      console.error("Error in fetchRCMDs:", errorMessage);
      set({ error: errorMessage, isLoading: false });
    }
  },

  deleteRCMD: async (id: string) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase.from("rcmds").delete().eq("id", id);

      if (error) throw error;

      set((state) => ({
        rcmds: state.rcmds.filter((rcmd) => rcmd.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to delete RCMD",
      });
      throw error;
    }
  },

  updateRCMD: async (id: string, updates: Partial<RCMD>) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      // First update the local state optimistically
      set((state) => ({
        rcmds: state.rcmds.map((rcmd) =>
          rcmd.id === id
            ? { ...rcmd, ...updates, updated_at: new Date().toISOString() }
            : rcmd
        ),
      }));

      // Then make the API call
      const { data, error } = await supabase
        .from("rcmds")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();

      if (error) throw error;

      // Update was successful
      set({ isLoading: false });
    } catch (error) {
      console.error("Error updating RCMD:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update RCMD";

      // Revert the optimistic update by fetching the current state
      try {
        const { data } = await supabase
          .from("rcmds")
          .select("*")
          .eq("id", id)
          .single();

        if (data) {
          set((state) => ({
            error: errorMessage,
            isLoading: false,
            rcmds: state.rcmds.map((rcmd) =>
              rcmd.id === id ? (data as RCMD) : rcmd
            ),
          }));
        } else {
          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      } catch (revertError) {
        // If we can't revert, at least set the error state
        set({
          error: errorMessage,
          isLoading: false,
        });
      }

      throw error;
    }
  },
}));
