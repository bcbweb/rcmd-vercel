"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createClient } from "@/utils/supabase/client";
import type { Collection, RCMDVisibility } from "@/types";

interface CollectionStore {
  isLoading: boolean;
  error: string | null;
  currentCollection: Collection | null;
  collections: Collection[];
  insertCollection: (input: {
    name: string;
    description: string;
    visibility: RCMDVisibility;
    linkIds: string[];
    rcmdIds: string[];
  }) => Promise<Collection | null>;
  fetchCollections: (userId?: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
}

export const useCollectionStore = create<CollectionStore>()(
  devtools(
    (set) => ({
      isLoading: false,
      error: null,
      currentCollection: null,
      collections: [],

      insertCollection: async (input) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          const { data: collection, error } = await supabase.rpc(
            "insert_collection",
            {
              payload: {
                name: input.name,
                description: input.description,
                visibility: input.visibility,
                linkIds: input.linkIds,
                rcmdIds: input.rcmdIds,
              },
            }
          );

          if (error) throw error;

          // Fetch the complete collection with items
          const { data: fullCollection, error: fetchError } = await supabase
            .from("collections")
            .select(
              `
              *,
              collection_items (
                *,
                rcmd:rcmd_id (*)
              )
            `
            )
            .eq("id", collection.id)
            .single();

          if (fetchError) throw fetchError;

          set((state) => ({
            isLoading: false,
            currentCollection: fullCollection as Collection,
            collections: [fullCollection as Collection, ...state.collections],
          }));

          return fullCollection as Collection;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to create collection";
          set({
            error: errorMessage,
            isLoading: false,
            currentCollection: null,
          });
          console.error("Error creating collection:", error);
          return null;
        }
      },

      fetchCollections: async (userId?: string) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          let query = supabase
            .from("collections")
            .select(
              `
              *,
              collection_items (
                *,
                rcmd:rcmd_id (*)
              )
            `
            )
            .order("created_at", { ascending: false });

          if (userId) {
            query = query.eq("owner_id", userId);
          }

          const { data, error } = await query;

          if (error) throw error;

          set({
            isLoading: false,
            collections: data as Collection[],
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch collections";
          set({
            error: errorMessage,
            isLoading: false,
          });
          console.error("Error fetching collections:", error);
        }
      },

      deleteCollection: async (id: string) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          // Optimistically update UI
          set((state) => ({
            collections: state.collections.filter((c) => c.id !== id),
          }));

          const { error } = await supabase
            .from("collections")
            .delete()
            .eq("id", id);

          if (error) throw error;

          set({ isLoading: false });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to delete collection";

          // Revert optimistic update on error
          const { data } = await supabase
            .from("collections")
            .select("*")
            .eq("id", id)
            .single();

          if (data) {
            set((state) => ({
              error: errorMessage,
              isLoading: false,
              collections: [...state.collections, data as Collection],
            }));
          } else {
            set({
              error: errorMessage,
              isLoading: false,
            });
          }

          console.error("Error deleting collection:", error);
          throw error;
        }
      },

      updateCollection: async (id: string, updates: Partial<Collection>) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          // Optimistically update UI
          set((state) => ({
            collections: state.collections.map((collection) =>
              collection.id === id
                ? {
                    ...collection,
                    ...updates,
                    updated_at: new Date().toISOString(),
                  }
                : collection
            ),
          }));

          const { error } = await supabase
            .from("collections")
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select();

          if (error) throw error;

          set({ isLoading: false });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to update collection";

          // Revert optimistic update on error
          const { data } = await supabase
            .from("collections")
            .select(
              `
              *,
              collection_items (
                *,
                rcmd:rcmd_id (*)
              )
            `
            )
            .eq("id", id)
            .single();

          if (data) {
            set((state) => ({
              error: errorMessage,
              isLoading: false,
              collections: state.collections.map((collection) =>
                collection.id === id ? (data as Collection) : collection
              ),
            }));
          } else {
            set({
              error: errorMessage,
              isLoading: false,
            });
          }

          console.error("Error updating collection:", error);
          throw error;
        }
      },
    }),
    {
      name: "Collection Store",
    }
  )
);
