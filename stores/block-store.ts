import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createClient } from '@/utils/supabase/client';

interface BlockStore {
  isLoading: boolean;
  error: string | null;
  saveRCMDBlock: (profileId: string, rcmdId: string) => Promise<boolean>;
  saveTextBlock: (profileId: string, content: string) => Promise<boolean>;
  saveImageBlock: (
    profileId: string,
    imageUrl: string,
    caption: string,
    originalFilename: string,
    sizeBytes: number,
    mimeType: string,
    width: number,
    height: number
  ) => Promise<boolean>;
  saveLinkBlock: (profileId: string, linkId: string) => Promise<boolean>;
}

export const useBlockStore = create<BlockStore>()(
  devtools(
    (set) => ({
      isLoading: false,
      error: null,

      saveRCMDBlock: async (profileId: string, rcmdId: string) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase
            .rpc('insert_rcmd_block', {
              p_profile_id: profileId,
              p_rcmd_id: rcmdId
            });

          if (error) throw error;

          set({ isLoading: false });
          return true;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to save recommendation block';
          set({ error: errorMessage, isLoading: false });
          console.error('Error saving recommendation block:', error);
          return false;
        }
      },

      saveTextBlock: async (profileId: string, content: string) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase
            .rpc('insert_text_block', {
              p_profile_id: profileId,
              p_text: content
            });

          if (error) throw error;

          set({ isLoading: false });
          return true;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to save text block';
          set({ error: errorMessage, isLoading: false });
          console.error('Error saving text block:', error);
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
        height: number
      ) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase
            .rpc('insert_image_block', {
              p_profile_id: profileId,
              p_image_url: imageUrl,
              p_caption: caption,
              p_original_filename: originalFilename,
              p_size_bytes: sizeBytes,
              p_mime_type: mimeType,
              p_width: width,
              p_height: height
            });

          if (error) throw error;

          set({ isLoading: false });
          return true;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to save image block';
          set({ error: errorMessage, isLoading: false });
          console.error('Error saving image block:', error);
          return false;
        }
      },

      saveLinkBlock: async (profileId: string, linkId: string) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase
            .rpc('insert_link_block', {
              p_profile_id: profileId,
              p_link_id: linkId
            });

          if (error) throw error;

          set({ isLoading: false });
          return true;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to save link block';
          set({ error: errorMessage, isLoading: false });
          console.error('Error saving link block:', error);
          return false;
        }
      }
    }),
    {
      name: 'Block Store'
    }
  )
);