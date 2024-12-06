import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import type { Link } from "@/types";

interface LinkStore {
  links: Link[];
  isLoading: boolean;
  error: string | null;
  insertLink: (
    title: string,
    url: string,
    description: string,
    type: string,
    visibility: string
  ) => Promise<Link | null>;
  fetchLinks: () => Promise<void>;
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
    visibility: string
  ) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .rpc('insert_link', {
          p_title: title,
          p_url: url,
          p_description: description,
          p_type: type,
          p_visibility: visibility
        });

      if (error) throw error;

      // Refresh the links list
      await get().fetchLinks();

      set({ isLoading: false });
      return data[0] as Link;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to insert link';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  fetchLinks: async () => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ links: data || [], isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch links';
      set({ error: errorMessage, isLoading: false });
    }
  },
}));