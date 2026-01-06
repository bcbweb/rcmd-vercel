"use client";

import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import type { Link, CollectionItem, Collection } from "@/types";

interface LinkStore {
  links: Link[];
  isLoading: boolean;
  error: string | null;
  insertLink: (
    title: string,
    url: string,
    description: string,
    type: string,
    visibility: string,
    profile_id?: string
  ) => Promise<Link | null>;
  fetchLinks: (userId?: string, profileId?: string) => Promise<void>;
  deleteLink: (id: string, skipConfirmation?: boolean) => Promise<void>;
  updateLink: (id: string, updates: Partial<Link>) => Promise<Link | null>;
  reorderLinks: (
    linkId: string,
    newOrder: number,
    profileId?: string,
    ownerId?: string
  ) => Promise<void>;
}

export const useLinkStore = create<LinkStore>((set, get) => ({
  links: [],
  isLoading: false,
  error: null,

  insertLink: async (
    title: string,
    url: string,
    description: string,
    type: string,
    visibility: string,
    profile_id?: string
  ) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.rpc("insert_link", {
        p_title: title,
        p_url: url,
        p_description: description,
        p_type: type,
        p_visibility: visibility,
        p_profile_id: profile_id,
      });

      if (error) throw error;

      set((state) => ({
        links: [data[0] as Link, ...state.links],
        isLoading: false,
      }));

      return data[0] as Link;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to insert link";
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  fetchLinks: async (userId?: string, profileId?: string) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      // Build the query - use created_at as primary sort for now
      // display_order will be used for client-side sorting if available
      let query = supabase
        .from("links")
        .select("*")
        .order("created_at", { ascending: false });

      if (profileId) {
        // If profileId is explicitly provided, use it
        console.log("[DEBUG] Querying links by profile_id:", profileId);
        query = query.eq("profile_id", profileId);
      } else if (userId) {
        // Support both profile_id and legacy owner_id
        console.log("[DEBUG] Querying links by profile_id or owner_id:", userId);
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
          console.log("Using profile_id for links query:", profileData.id);
          query = query.eq("profile_id", profileData.id);
        } else {
          // Fall back to owner_id for backward compatibility
          console.log("No profile found, falling back to owner_id:", user.id);
          query = query.eq("owner_id", user.id);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("[DEBUG] Error fetching links:", error);
        // If error is about display_order column not existing, that's okay
        // We'll just use created_at ordering
        if (
          error.message?.includes("display_order") ||
          error.message?.includes("column")
        ) {
          console.log(
            "[DEBUG] display_order column not found, using created_at ordering only"
          );
          // If it's just a column error, we can still proceed with empty data
          // The query might have partially succeeded
        } else {
          throw error;
        }
      }

      console.log(`[DEBUG] Fetched ${data?.length || 0} links from database`);

      // Sort client-side by display_order if available, then by created_at
      let sortedData = data || [];
      if (sortedData.length > 0) {
        // Check if any link has display_order property (column exists)
        const hasDisplayOrder = sortedData.some(
          (link: Link) => "display_order" in link && link.display_order != null
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

      console.log(`Found ${sortedData.length} links`);
      set({ links: sortedData, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch links";
      set({ error: errorMessage, isLoading: false });
    }
  },

  deleteLink: async (id: string) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { error: linkError } = await supabase
        .from("links")
        .delete()
        .eq("id", id);

      if (linkError) throw linkError;

      set((state) => ({
        links: state.links.filter((link) => link.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to delete link",
      });
      throw error;
    }
  },

  updateLink: async (id: string, updates: Partial<Link>) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      // Optimistically update UI
      set((state) => ({
        links: state.links.map((link) =>
          link.id === id
            ? { ...link, ...updates, updated_at: new Date().toISOString() }
            : link
        ),
      }));

      const { data, error } = await supabase
        .from("links")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();

      if (error) throw error;

      set({ isLoading: false });

      // Return the updated link if available
      return data?.[0] as Link;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update link";

      // Revert optimistic update on error
      const { data } = await supabase
        .from("links")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        set((state) => ({
          error: errorMessage,
          isLoading: false,
          links: state.links.map((link) =>
            link.id === id ? (data as Link) : link
          ),
        }));
      } else {
        set({
          error: errorMessage,
          isLoading: false,
        });
      }

      throw error;
    }
  },

  reorderLinks: async (
    linkId: string,
    newOrder: number,
    profileId?: string,
    ownerId?: string
  ) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase.rpc("reorder_links", {
        p_link_id: linkId,
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
            "[DEBUG] reorder_links function not found. Please apply migration: supabase/migrations/20250115_add_display_order_to_links.sql"
          );
          throw new Error(
            "Reordering is not available yet. Please apply the database migration first."
          );
        }
        throw error;
      }

      // Refetch links to get updated order
      const currentState = get();
      if (profileId) {
        await currentState.fetchLinks(ownerId, profileId);
      } else if (ownerId) {
        await currentState.fetchLinks(ownerId);
      } else {
        await currentState.fetchLinks();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to reorder links";
      console.error("Error reordering links:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));
