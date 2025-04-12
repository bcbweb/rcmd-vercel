"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createClient } from "@/utils/supabase/client";

interface BlockStore {
  isLoading: boolean;
  error: string | null;
  saveRCMDBlock: (
    profileId: string,
    rcmdId: string,
    pageId?: string
  ) => Promise<boolean>;
  saveTextBlock: (
    profileId: string,
    content: string,
    pageId?: string
  ) => Promise<boolean>;
  saveImageBlock: (
    profileId: string,
    imageUrl: string,
    caption: string,
    originalFilename: string,
    sizeBytes: number,
    mimeType: string,
    width: number,
    height: number,
    pageId?: string
  ) => Promise<boolean>;
  saveLinkBlock: (
    profileId: string,
    linkId: string,
    pageId?: string
  ) => Promise<boolean>;
  saveCollectionBlock: (
    profileId: string,
    collectionId: string,
    pageId?: string
  ) => Promise<boolean>;
}

export const useBlockStore = create<BlockStore>()(
  devtools(
    (set) => ({
      isLoading: false,
      error: null,

      saveRCMDBlock: async (
        profileId: string,
        rcmdId: string,
        pageId?: string
      ) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          if (!profileId) {
            throw new Error("Profile ID is required");
          }

          if (!rcmdId) {
            throw new Error("RCMD ID is required");
          }

          // Check if the profile exists
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", profileId)
            .single();

          if (profileError || !profileData) {
            console.error("Error checking profile:", profileError);
            throw new Error(`Profile not found with ID: ${profileId}`);
          }

          // Check if profile has any pages
          const { data: pages, error: pagesError } = await supabase
            .from("profile_pages")
            .select("id")
            .eq("profile_id", profileId)
            .order("created_at", { ascending: true });

          if (pagesError) {
            console.error("Error checking pages:", pagesError);
            throw new Error("Error checking profile pages");
          }

          if (!pages || pages.length === 0) {
            throw new Error(
              "Please create a page before adding blocks. Go to Profile Settings to create your first page."
            );
          }

          // Try a direct SQL approach as a workaround for the RPC function overloading issue
          console.log(
            "Using direct SQL approach to avoid function overloading"
          );

          // Get the first page
          const firstPage = pages[0].id;

          // Get authenticated user
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error("Not authenticated");

          // Get next display order
          const { data: orderData, error: orderError } = await supabase
            .from("profile_blocks")
            .select("display_order")
            .eq("profile_id", profileId)
            .order("display_order", { ascending: false })
            .limit(1);

          const nextOrder =
            orderData && orderData.length > 0
              ? orderData[0].display_order + 1
              : 1;

          // Step 1: Insert profile block
          const { data: blockData, error: blockError } = await supabase
            .from("profile_blocks")
            .insert({
              profile_id: profileId,
              type: "rcmd",
              auth_user_id: user.id,
              display_order: nextOrder,
              page_id: firstPage,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select("id")
            .single();

          if (blockError) {
            console.error("Error creating profile block:", blockError);
            throw blockError;
          }

          // Step 2: Insert rcmd block
          const { data: rcmdBlockData, error: rcmdBlockError } = await supabase
            .from("rcmd_blocks")
            .insert({
              profile_block_id: blockData.id,
              rcmd_id: rcmdId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (rcmdBlockError) {
            console.error("Error creating RCMD block:", rcmdBlockError);
            // Clean up the profile block
            await supabase
              .from("profile_blocks")
              .delete()
              .eq("id", blockData.id);
            throw rcmdBlockError;
          }

          console.log("RCMD block created successfully:", {
            profile_block_id: blockData.id,
            rcmd_id: rcmdId,
            page_id: firstPage,
          });

          set({ isLoading: false });
          return true;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to save RCMD block";
          set({ error: errorMessage, isLoading: false });
          console.error("Error saving RCMD block:", error);
          return false;
        }
      },

      saveTextBlock: async (
        profileId: string,
        content: string,
        pageId?: string
      ) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase.rpc("insert_text_block", {
            p_profile_id: profileId,
            p_text: content,
            p_page_id: pageId || null,
          });

          if (error) throw error;

          set({ isLoading: false });
          return true;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to save text block";
          set({ error: errorMessage, isLoading: false });
          console.error("Error saving text block:", error);
          return false;
        }
      },

      saveImageBlock: async (
        profileId: string,
        imageUrl: string,
        caption: string,
        originalFilename: string,
        sizeBytes: number,
        mimeType: string,
        width: number,
        height: number,
        pageId?: string
      ) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase.rpc("insert_image_block", {
            p_profile_id: profileId,
            p_image_url: imageUrl,
            p_caption: caption,
            p_original_filename: originalFilename,
            p_size_bytes: sizeBytes,
            p_mime_type: mimeType,
            p_width: width,
            p_height: height,
            p_page_id: pageId || null,
          });

          if (error) throw error;

          set({ isLoading: false });
          return true;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to save image block";
          set({ error: errorMessage, isLoading: false });
          console.error("Error saving image block:", error);
          return false;
        }
      },

      saveLinkBlock: async (
        profileId: string,
        linkId: string,
        pageId?: string
      ) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase.rpc("insert_link_block", {
            p_profile_id: profileId,
            p_link_id: linkId,
            p_page_id: pageId || null,
          });

          if (error) throw error;

          set({ isLoading: false });
          return true;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to save link block";
          set({ error: errorMessage, isLoading: false });
          console.error("Error saving link block:", error);
          return false;
        }
      },

      saveCollectionBlock: async (
        profileId: string,
        collectionId: string,
        pageId?: string
      ) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase.rpc("insert_collection_block", {
            p_profile_id: profileId,
            p_collection_id: collectionId,
            p_page_id: pageId || null,
          });

          if (error) throw error;

          set({ isLoading: false });
          return true;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to save collection block";
          set({ error: errorMessage, isLoading: false });
          console.error("Error saving collection block:", error);
          return false;
        }
      },
    }),
    {
      name: "Block Store",
    }
  )
);
