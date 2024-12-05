import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createClient } from '@/utils/supabase/client';

interface RCMD {
  id: string;
  title: string;
  description: string;
  type: string;
  visibility: string;
  owner_id: string;
  featured_image?: string;
  created_at: string;
  updated_at: string;
}

interface RCMDStore {
  isLoading: boolean;
  error: string | null;
  currentRCMD: RCMD | null;
  saveRCMD: (
    title: string,
    description: string,
    type: string,
    visibility: string,
    imageUrl?: string
  ) => Promise<RCMD | null>;
}

export const useRCMDStore = create<RCMDStore>()(
  devtools(
    (set) => ({
      isLoading: false,
      error: null,
      currentRCMD: null,

      saveRCMD: async (
        title: string,
        description: string,
        type: string,
        visibility: string,
        imageUrl?: string
      ) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          const { data, error } = await supabase
            .rpc('insert_rcmd', {
              p_title: title,
              p_description: description,
              p_type: type,
              p_visibility: visibility,
              p_featured_image: imageUrl
            })
            .single();

          if (error) throw error;

          set({
            isLoading: false,
            currentRCMD: data as RCMD
          });

          return data as RCMD;

        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'Failed to save recommendation';
          set({
            error: errorMessage,
            isLoading: false,
            currentRCMD: null
          });
          console.error('Error saving recommendation:', error);
          return null;
        }
      },
    }),
    {
      name: 'RCMD Store'
    }
  )
);