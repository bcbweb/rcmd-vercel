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
  reorderRCMDs: (
    rcmdId: string,
    newOrder: number,
    profileId?: string,
    ownerId?: string
  ) => Promise<void>;
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
      // Build the query - use created_at as primary sort for now
      // display_order will be used for client-side sorting if available
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

      if (error) {
        // If error is about display_order column not existing, that's okay
        // We'll just use created_at ordering
        if (error.message?.includes("display_order")) {
          console.log(
            "[DEBUG] display_order column not found, using created_at ordering only"
          );
        } else {
          throw error;
        }
      }

      // Sort client-side by display_order if available, then by created_at
      let sortedData = data || [];
      if (sortedData.length > 0) {
        // Check if any RCMD has display_order property (column exists)
        const hasDisplayOrder = sortedData.some(
          (rcmd: RCMD) => "display_order" in rcmd && rcmd.display_order != null
        );

        if (hasDisplayOrder) {
          sortedData = [...sortedData].sort((a, b) => {
            // If both have display_order, sort by it
            if (a.display_order != null && b.display_order != null) {
              return a.display_order - b.display_order;
            }
            // If only one has display_order, prioritize it
            if (a.display_order != null) return -1;
            if (b.display_order != null) return 1;
            // Otherwise sort by created_at
            const aDate = new Date(a.created_at || 0).getTime();
            const bDate = new Date(b.created_at || 0).getTime();
            return bDate - aDate; // descending
          });
        }
      }

      console.log(`Found ${sortedData.length} RCMDs`);
      set({ rcmds: sortedData, isLoading: false });
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

  reorderRCMDs: async (
    rcmdId: string,
    newOrder: number,
    profileId?: string,
    ownerId?: string
  ) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase.rpc("reorder_rcmds", {
        p_rcmd_id: rcmdId,
        p_new_order: newOrder,
        p_profile_id: profileId || null,
        p_owner_id: ownerId || null,
      });

      if (error) {
        // Check if the function doesn't exist (migration not applied)
        if (
          error.message?.includes("Could not find the function") ||
          error.code === "PGRST202"
        ) {
          console.error(
            "[DEBUG] reorder_rcmds function not found. Please apply migration: supabase/migrations/20250115_add_display_order_to_rcmds.sql"
          );
          throw new Error(
            "Reordering is not available yet. Please apply the database migration first."
          );
        }
        throw error;
      }

      // Refetch RCMDs to get updated order
      const currentState = get();
      await currentState.fetchRCMDs(profileId || ownerId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reorder RCMDs";
      console.error("Error reordering RCMDs:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));
