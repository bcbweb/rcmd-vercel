"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createClient } from "@/utils/supabase/client";
import type { Collection, RCMDVisibility, CollectionWithItems } from "@/types";
import { useProfileStore } from "@/stores/profile-store";

// Define the RCMDVisibility enum for use as values
enum RCMDVisibilityEnum {
  PUBLIC = "public",
  PRIVATE = "private",
  UNLISTED = "unlisted",
}

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
    profile_id?: string;
  }) => Promise<Collection | null>;
  fetchCollections: (userId?: string, profileId?: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  updateCollection: (
    id: string,
    updatedCollection: Partial<CollectionWithItems> | any
  ) => Promise<{ data: any; error: string | null }>;
  reorderCollections: (
    collectionId: string,
    newOrder: number,
    profileId?: string,
    ownerId?: string
  ) => Promise<void>;
  updateCollectionItems: (
    collectionId: string,
    rcmdIds: string[],
    linkIds: string[]
  ) => Promise<{ data: any; error: string | null }>;
  batchUpdateCollection: (
    id: string,
    updates: {
      details?: Partial<Collection>;
      rcmdIds?: string[];
      linkIds?: string[];
    }
  ) => Promise<{ data: any; error: string | null }>;
}

export const useCollectionStore = create<CollectionStore>()(
  devtools(
    (set, get) => ({
      isLoading: false,
      error: null,
      currentCollection: null,
      collections: [],

      insertCollection: async (input) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          // Get active profile_id from profile store if not provided
          let activeProfileId = input.profile_id;
          if (!activeProfileId) {
            const profileState = useProfileStore.getState();
            if (profileState.profile?.id) {
              activeProfileId = profileState.profile.id;
              console.log(
                "[Collection Store] Using active profile_id:",
                activeProfileId
              );
            } else {
              // Fallback: get the active profile from database
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (user) {
                const { data: activeProfile } = await supabase
                  .from("user_active_profiles")
                  .select("profile_id")
                  .eq("auth_user_id", user.id)
                  .single();
                if (activeProfile) {
                  activeProfileId = activeProfile.profile_id;
                }
              }
            }
          }

          const { data: collection, error } = await supabase.rpc(
            "insert_collection",
            {
              payload: {
                name: input.name,
                description: input.description,
                visibility: input.visibility,
                linkIds: input.linkIds,
                rcmdIds: input.rcmdIds,
                profile_id: activeProfileId,
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

      fetchCollections: async (userId?: string, profileId?: string) => {
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

          // Get active profile_id from profile store
          let activeProfileId: string | undefined = profileId;
          if (!activeProfileId) {
            const profileState = useProfileStore.getState();
            if (profileState.profile?.id) {
              activeProfileId = profileState.profile.id;
              console.log(
                "[Collection Store] Using active profile_id from store:",
                activeProfileId
              );
            } else {
              // Fallback: get the active profile from database
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (user) {
                const { data: activeProfile } = await supabase
                  .from("user_active_profiles")
                  .select("profile_id")
                  .eq("auth_user_id", user.id)
                  .single();
                if (activeProfile) {
                  activeProfileId = activeProfile.profile_id;
                  console.log(
                    "[Collection Store] Using active profile_id from DB:",
                    activeProfileId
                  );
                }
              }
            }
          }

          if (activeProfileId) {
            // Use active profile_id to filter collections - they are unique per profile
            query = query.eq("profile_id", activeProfileId);
          } else if (userId) {
            // Legacy support: if no active profile, support both profile_id and owner_id
            query = query.or(`profile_id.eq.${userId},owner_id.eq.${userId}`);
          } else {
            const {
              data: { user },
              error: userError,
            } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) throw new Error("No user found");

            // Fall back to owner_id for backward compatibility
            console.log(
              "[Collection Store] No active profile found, falling back to owner_id:",
              user.id
            );
            query = query.eq("owner_id", user.id);
          }

          const { data, error } = await query;

          if (error) {
            console.error("[DEBUG] Error fetching collections:", error);
            // If error is about display_order column not existing, that's okay
            if (
              error.message?.includes("display_order") ||
              error.message?.includes("column")
            ) {
              console.log(
                "[DEBUG] display_order column not found, using created_at ordering only"
              );
            } else {
              throw error;
            }
          }

          console.log(
            `[DEBUG] Fetched ${data?.length || 0} collections from database`
          );

          // Sort client-side by display_order if available, then by created_at
          let sortedData = data || [];
          if (sortedData.length > 0) {
            // Check if any collection has display_order property (column exists)
            const hasDisplayOrder = sortedData.some(
              (collection: Collection) =>
                "display_order" in collection &&
                collection.display_order != null
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

          set({
            isLoading: false,
            collections: sortedData as Collection[],
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
          // Use the RPC function to delete the collection and all associated items
          const { data, error } = await supabase.rpc("delete_collection", {
            p_id: id,
          });

          if (error) throw error;

          // Update state after successful deletion
          set((state) => ({
            collections: state.collections.filter((c) => c.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          console.error("Error in deleteCollection:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to delete collection";

          set({
            error: errorMessage,
            isLoading: false,
          });

          throw error;
        }
      },

      updateCollection: async (
        id: string,
        updatedCollection: Partial<CollectionWithItems> | any
      ) => {
        const supabase = createClient();
        try {
          console.log("store: updating collection", id, updatedCollection);

          // Basic validation
          if (!id) {
            throw new Error("Missing collection ID");
          }

          // Create a clean update object with only valid fields
          const updateObj: Record<string, any> = {
            updated_at: new Date().toISOString(),
          };

          // Only include valid fields that are present
          if (updatedCollection?.name !== undefined) {
            updateObj.name = updatedCollection.name;
          }

          if (updatedCollection?.description !== undefined) {
            updateObj.description = updatedCollection.description;
          }

          if (updatedCollection?.visibility !== undefined) {
            updateObj.visibility = updatedCollection.visibility;
          } else if (
            updatedCollection?.visibility === undefined &&
            updatedCollection?.name !== undefined
          ) {
            // Only set default visibility if we're doing a substantial update
            updateObj.visibility = RCMDVisibilityEnum.PUBLIC;
          }

          console.log("store: clean update object", updateObj);

          // Apply optimistic update immediately to improve UI responsiveness
          set((state) => ({
            isLoading: true,
            error: null,
            // Update all collections
            collections: state.collections.map((collection) =>
              collection.id === id
                ? {
                    ...collection,
                    ...updateObj,
                  }
                : collection
            ),
            // Update currentCollection only if it's the one being updated
            currentCollection:
              state.currentCollection?.id === id
                ? {
                    ...state.currentCollection,
                    ...updateObj,
                  }
                : state.currentCollection,
          }));

          // Instead of a direct update, use the update_collection RPC function
          // This ensures proper permission handling and trigger execution
          const { data, error } = await supabase.rpc("update_collection", {
            p_collection_id: id,
            p_updates: updateObj,
          });

          if (error) throw error;

          console.log("store: collection updated successfully via RPC", data);

          // Get the updated collection data after RPC call
          const { data: refreshedData, error: fetchError } = await supabase
            .from("collections")
            .select("*")
            .eq("id", id)
            .single();

          if (fetchError) {
            console.error("Error fetching updated collection:", fetchError);
          }

          const updatedData = refreshedData || data;

          // Final update with server data to ensure consistency
          if (updatedData) {
            set((state) => ({
              isLoading: false,
              collections: state.collections.map((collection) =>
                collection.id === id
                  ? { ...collection, ...updatedData }
                  : collection
              ),
              currentCollection:
                state.currentCollection?.id === id
                  ? { ...state.currentCollection, ...updatedData }
                  : state.currentCollection,
            }));
          } else {
            set({ isLoading: false });
          }

          return { data: updatedData, error: null };
        } catch (error: any) {
          console.error("Error updating collection:", error);
          set({ isLoading: false, error: error.message });
          return {
            data: null,
            error: error.message || "Failed to update collection",
          };
        }
      },

      updateCollectionItems: async (
        collectionId: string,
        rcmdIds: string[],
        linkIds: string[]
      ) => {
        const supabase = createClient();
        try {
          console.log("store: updating collection items for", collectionId);
          console.log("rcmdIds:", JSON.stringify(rcmdIds));
          console.log("linkIds:", JSON.stringify(linkIds));

          // Validate input
          if (!collectionId) {
            console.error("Missing collectionId");
            throw new Error("Missing collectionId");
          }

          // First check if the collection exists
          const { data: existingCollection, error: checkError } = await supabase
            .from("collections")
            .select("id")
            .eq("id", collectionId)
            .maybeSingle();

          if (checkError) {
            throw checkError;
          }

          if (!existingCollection) {
            throw new Error(`Collection with ID ${collectionId} not found`);
          }

          // Ensure rcmdIds and linkIds are arrays
          const safeRcmdIds = Array.isArray(rcmdIds) ? rcmdIds : [];
          const safeLinkIds = Array.isArray(linkIds) ? linkIds : [];

          console.log("Safe rcmdIds:", JSON.stringify(safeRcmdIds));
          console.log("Safe linkIds:", JSON.stringify(safeLinkIds));

          // Start loading before making any DB changes
          set({ isLoading: true, error: null });

          // Apply optimistic update first
          set((state) => {
            // Create new collection items for optimistic update
            const optimisticRcmdItems = safeRcmdIds.map((rcmdId, index) => ({
              id: `temp-rcmd-${rcmdId}`, // Temporary ID for optimistic update
              collection_id: collectionId,
              item_type: "rcmd",
              rcmd_id: rcmdId,
              order_index: index,
              created_at: new Date().toISOString(),
            }));

            const optimisticLinkItems = safeLinkIds.map((linkId, index) => ({
              id: `temp-link-${linkId}`, // Temporary ID for optimistic update
              collection_id: collectionId,
              item_type: "link",
              link_id: linkId,
              order_index: safeRcmdIds.length + index,
              created_at: new Date().toISOString(),
            }));

            // Find this collection in the collections array
            const updatedCollections = state.collections.map((collection) => {
              if (collection.id === collectionId) {
                // Return updated collection with new items
                return {
                  ...collection,
                  collection_items: [
                    ...optimisticRcmdItems,
                    ...optimisticLinkItems,
                  ],
                  updated_at: new Date().toISOString(),
                };
              }
              return collection;
            });

            // Update current collection if it's the one we're changing
            const updatedCurrentCollection =
              state.currentCollection?.id === collectionId
                ? {
                    ...state.currentCollection,
                    collection_items: [
                      ...optimisticRcmdItems,
                      ...optimisticLinkItems,
                    ],
                    updated_at: new Date().toISOString(),
                  }
                : state.currentCollection;

            return {
              collections: updatedCollections,
              currentCollection: updatedCurrentCollection,
            };
          });

          // First delete existing collection items directly
          const { error: deleteError } = await supabase
            .from("collection_items")
            .delete()
            .eq("collection_id", collectionId);

          if (deleteError) {
            console.error(
              "Error deleting existing collection items:",
              deleteError
            );
            throw deleteError;
          }

          // Define a single transaction array for all inserts
          const insertPromises = [];

          // Insert RCMD items if any
          if (safeRcmdIds.length > 0) {
            const rcmdItems = safeRcmdIds.map((rcmdId, index) => ({
              collection_id: collectionId,
              item_type: "rcmd",
              rcmd_id: rcmdId,
              order_index: index,
            }));

            insertPromises.push(
              supabase.from("collection_items").insert(rcmdItems)
            );
          }

          // Insert Link items if any
          if (safeLinkIds.length > 0) {
            const linkItems = safeLinkIds.map((linkId, index) => ({
              collection_id: collectionId,
              item_type: "link",
              link_id: linkId,
              order_index: safeRcmdIds.length + index,
            }));

            insertPromises.push(
              supabase.from("collection_items").insert(linkItems)
            );
          }

          // Execute all insert operations in parallel
          const results = await Promise.all(insertPromises);
          const insertErrors = results
            .filter((result) => result.error)
            .map((result) => result.error);

          if (insertErrors.length > 0) {
            throw new Error(
              `Error inserting collection items: ${insertErrors.map((e) => e?.message || "Unknown error").join(", ")}`
            );
          }

          console.log("store: collection items updated successfully");

          // After updating items, fetch just this collection
          const { data: updatedCollection, error: fetchError } = await supabase
            .from("collections")
            .select(
              `
              *,
              collection_items(
                *,
                rcmd:rcmd_id(*)
              )
            `
            )
            .eq("id", collectionId)
            .maybeSingle();

          if (fetchError) throw fetchError;

          // Final state update with server data
          set((state) => {
            if (!updatedCollection) return { isLoading: false };

            return {
              isLoading: false,
              collections: state.collections.map((collection) =>
                collection.id === collectionId ? updatedCollection : collection
              ),
              currentCollection:
                state.currentCollection?.id === collectionId
                  ? updatedCollection
                  : state.currentCollection,
            };
          });

          return { data: updatedCollection, error: null };
        } catch (error: any) {
          console.error("Error updating collection items:", error);
          set({ isLoading: false, error: error.message });
          return {
            data: null,
            error: error.message || "Failed to update collection items",
          };
        }
      },

      batchUpdateCollection: async (
        id: string,
        updates: {
          details?: Partial<Collection>;
          rcmdIds?: string[];
          linkIds?: string[];
        }
      ) => {
        const supabase = createClient();
        try {
          console.log("store: batch updating collection", id, updates);

          // Basic validation
          if (!id) {
            throw new Error("Missing collection ID");
          }

          // Prepare collection detail updates
          let collectionUpdateResult = null;
          const updateObj: Record<string, any> = {
            updated_at: new Date().toISOString(),
          };

          // Only add fields that need updating
          if (updates.details) {
            if (updates.details.name !== undefined) {
              updateObj.name = updates.details.name;
            }
            if (updates.details.description !== undefined) {
              updateObj.description = updates.details.description;
            }
            if (updates.details.visibility !== undefined) {
              updateObj.visibility = updates.details.visibility;
            }
          }

          // Get safe rcmdIds and linkIds arrays
          const hasRcmdIds = Array.isArray(updates.rcmdIds);
          const hasLinkIds = Array.isArray(updates.linkIds);
          const safeRcmdIds = hasRcmdIds ? updates.rcmdIds! : [];
          const safeLinkIds = hasLinkIds ? updates.linkIds! : [];

          console.log("store: batch update details", {
            id,
            updateObj,
            hasRcmdIds,
            hasLinkIds,
            safeRcmdIds,
            safeLinkIds,
          });

          // Apply optimistic update for both collection details and items
          set((state) => {
            // Create optimistic collection items if updating items
            const optimisticItems: any[] = [];

            if (hasRcmdIds) {
              const rcmdItems = safeRcmdIds.map((rcmdId, index) => ({
                id: `temp-rcmd-${rcmdId}`,
                collection_id: id,
                item_type: "rcmd",
                rcmd_id: rcmdId,
                order_index: index,
                created_at: new Date().toISOString(),
              }));
              optimisticItems.push(...rcmdItems);
            }

            if (hasLinkIds) {
              const linkItems = safeLinkIds.map((linkId, index) => ({
                id: `temp-link-${linkId}`,
                collection_id: id,
                item_type: "link",
                link_id: linkId,
                order_index: safeRcmdIds.length + index,
                created_at: new Date().toISOString(),
              }));
              optimisticItems.push(...linkItems);
            }

            // Update collections array
            const updatedCollections = state.collections.map((collection) => {
              if (collection.id === id) {
                const updatedCollection = {
                  ...collection,
                  ...updateObj,
                };

                // Only update items if we're updating items
                if (hasRcmdIds || hasLinkIds) {
                  (updatedCollection as any).collection_items = optimisticItems;
                }

                return updatedCollection;
              }
              return collection;
            });

            // Update current collection if it's the one being updated
            let updatedCurrentCollection = state.currentCollection;
            if (state.currentCollection?.id === id) {
              updatedCurrentCollection = {
                ...state.currentCollection,
                ...updateObj,
              };

              // Only update items if we're updating items
              if (hasRcmdIds || hasLinkIds) {
                (updatedCurrentCollection as any).collection_items =
                  optimisticItems;
              }
            }

            return {
              isLoading: true,
              error: null,
              collections: updatedCollections,
              currentCollection: updatedCurrentCollection,
            };
          });

          // First, update collection details if needed
          if (Object.keys(updateObj).length > 1) {
            // More than just updated_at
            const { data, error } = await supabase.rpc("update_collection", {
              p_collection_id: id,
              p_updates: updateObj,
            });

            if (error) throw error;
            collectionUpdateResult = data;
            console.log(
              "store: collection details updated successfully via RPC",
              data
            );
          }

          // Then, update collection items if needed
          if (hasRcmdIds || hasLinkIds) {
            // Delete existing items
            const { error: deleteError } = await supabase
              .from("collection_items")
              .delete()
              .eq("collection_id", id);

            if (deleteError) {
              throw deleteError;
            }

            // Insert new items
            const insertPromises = [];

            // Insert RCMD items if any
            if (safeRcmdIds.length > 0) {
              const rcmdItems = safeRcmdIds.map((rcmdId, index) => ({
                collection_id: id,
                item_type: "rcmd",
                rcmd_id: rcmdId,
                order_index: index,
              }));

              insertPromises.push(
                supabase.from("collection_items").insert(rcmdItems)
              );
            }

            // Insert Link items if any
            if (safeLinkIds.length > 0) {
              const linkItems = safeLinkIds.map((linkId, index) => ({
                collection_id: id,
                item_type: "link",
                link_id: linkId,
                order_index: safeRcmdIds.length + index,
              }));

              insertPromises.push(
                supabase.from("collection_items").insert(linkItems)
              );
            }

            // Execute all insert operations in parallel
            if (insertPromises.length > 0) {
              const results = await Promise.all(insertPromises);
              const insertErrors = results
                .filter((result) => result.error)
                .map((result) => result.error);

              if (insertErrors.length > 0) {
                throw new Error(
                  `Error inserting collection items: ${insertErrors
                    .map((e) => e?.message || "Unknown error")
                    .join(", ")}`
                );
              }
            }

            console.log("store: collection items updated successfully");
          }

          // Fetch the updated collection with all its items
          const { data: updatedCollection, error: fetchError } = await supabase
            .from("collections")
            .select(
              `
              *,
              collection_items(
                *,
                rcmd:rcmd_id(*)
              )
            `
            )
            .eq("id", id)
            .maybeSingle();

          if (fetchError) {
            console.error("Error fetching updated collection:", fetchError);
            throw fetchError;
          }

          if (!updatedCollection) {
            throw new Error("Failed to fetch updated collection");
          }

          // Final state update with server data
          set((state) => ({
            isLoading: false,
            collections: state.collections.map((collection) =>
              collection.id === id ? updatedCollection : collection
            ),
            currentCollection:
              state.currentCollection?.id === id
                ? updatedCollection
                : state.currentCollection,
          }));

          return {
            data: updatedCollection,
            error: null,
          };
        } catch (error: any) {
          console.error("Error in batch updating collection:", error);
          set({ isLoading: false, error: error.message });
          return {
            data: null,
            error: error.message || "Failed to update collection",
          };
        }
      },

      reorderCollections: async (
        collectionId: string,
        newOrder: number,
        profileId?: string,
        ownerId?: string
      ) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase.rpc("reorder_collections", {
            p_collection_id: collectionId,
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
                "[DEBUG] reorder_collections function not found. Please apply migration: supabase/migrations/20250115_add_display_order_to_collections.sql"
              );
              throw new Error(
                "Reordering is not available yet. Please apply the database migration first."
              );
            }
            throw error;
          }

          // Refetch collections to get updated order
          const currentState = get();
          if (profileId) {
            await currentState.fetchCollections(ownerId, profileId);
          } else if (ownerId) {
            await currentState.fetchCollections(ownerId);
          } else {
            await currentState.fetchCollections();
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to reorder collections";
          console.error("Error reordering collections:", errorMessage);
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
    }),
    { name: "collection-store" }
  )
);
