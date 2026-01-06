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
    pageId?: string,
    showBorder?: boolean
  ) => Promise<boolean>;
  saveTextBlock: (
    profileId: string,
    content: string,
    pageId?: string,
    showBorder?: boolean
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
    pageId?: string,
    showBorder?: boolean
  ) => Promise<boolean>;
  saveLinkBlock: (
    profileId: string,
    linkId: string,
    pageId?: string,
    showBorder?: boolean
  ) => Promise<boolean>;
  saveCollectionBlock: (
    profileId: string,
    collectionId: string,
    pageId?: string,
    showBorder?: boolean
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
        pageId?: string,
        showBorder: boolean = false
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

          console.log("Saving RCMD block with:", {
            profile_id: profileId,
            rcmd_id: rcmdId,
            page_id: pageId || "not provided (will use first page)",
            show_border: showBorder,
          });

          // Use the RPC function - it handles page ID validation internally
          const { data, error } = await supabase.rpc("insert_rcmd_block", {
            p_profile_id: profileId,
            p_rcmd_id: rcmdId,
            p_page_id: pageId || null,
            p_show_border: showBorder,
          });

          if (error) {
            console.error("RPC error details:", error);
            throw error;
          }

          console.log("RCMD block created successfully:", data);

          // Check if the RPC function returned a success: false, which indicates a logical error
          if (data && data.success === false) {
            throw new Error(data.message || "Failed to create RCMD block");
          }

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
        pageId?: string,
        showBorder: boolean = false
      ) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          if (!profileId) {
            throw new Error("Profile ID is required");
          }

          if (!content || content.trim() === "" || content === "<p></p>") {
            throw new Error("Text content cannot be empty");
          }

          const { data, error } = await supabase.rpc("insert_text_block", {
            p_profile_id: profileId,
            p_text: content,
            p_page_id: pageId || null,
            p_show_border: showBorder,
          });

          if (error) {
            console.error("[DEBUG] insert_text_block RPC error:", error);
            throw error;
          }

          if (!data || data.length === 0) {
            console.warn("[DEBUG] insert_text_block returned no data");
          }

          set({ isLoading: false });
          return true;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : typeof error === "object" &&
                  error !== null &&
                  "message" in error
                ? String(error.message)
                : "Failed to save text block";
          set({ error: errorMessage, isLoading: false });
          console.error("[DEBUG] Error saving text block:", error);
          throw error; // Re-throw so the modal can show the error
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
        pageId?: string,
        showBorder: boolean = false
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
            p_show_border: showBorder,
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
        pageId?: string,
        showBorder: boolean = false
      ) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase.rpc("insert_link_block", {
            p_profile_id: profileId,
            p_link_id: linkId,
            p_page_id: pageId || null,
            p_show_border: showBorder,
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
        pageId?: string,
        showBorder: boolean = false
      ) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase.rpc("insert_collection_block", {
            p_profile_id: profileId,
            p_collection_id: collectionId,
            p_page_id: pageId || null,
            p_show_border: showBorder,
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
