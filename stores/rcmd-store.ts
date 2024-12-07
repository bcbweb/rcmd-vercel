import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import type { RCMD } from '@/types';

interface RCMDStore {
  rcmds: RCMD[];
  isLoading: boolean;
  error: string | null;
  insertRCMD: (
    title: string,
    description: string,
    type: string,
    visibility: string,
    imageUrl?: string
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
        });

      if (error) throw error;

      set((state) => ({
        rcmds: [data[0] as RCMD, ...state.rcmds],
        isLoading: false
      }));

      return data[0] as RCMD;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to insert RCMD';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  fetchRCMDs: async (userId?: string) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      let query = supabase
        .from('rcmds')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('owner_id', userId);
      } else {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('No user found');
        query = query.eq('owner_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      set({ rcmds: data || [], isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch RCMDs';
      set({ error: errorMessage, isLoading: false });
    }
  },

  deleteRCMD: async (id: string) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from('rcmds')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        rcmds: state.rcmds.filter(rcmd => rcmd.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete RCMD'
      });
      throw error;
    }
  },

  updateRCMD: async (id: string, updates: Partial<RCMD>) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      set((state) => ({
        rcmds: state.rcmds.map((rcmd) =>
          rcmd.id === id
            ? { ...rcmd, ...updates, updated_at: new Date().toISOString() }
            : rcmd
        ),
      }));

      const { error } = await supabase
        .from('rcmds')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;

      set({ isLoading: false });

    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to update RCMD';

      const { data } = await supabase
        .from('rcmds')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        set((state) => ({
          error: errorMessage,
          isLoading: false,
          rcmds: state.rcmds.map((rcmd) =>
            rcmd.id === id
              ? data as RCMD
              : rcmd
          )
        }));
      } else {
        set({
          error: errorMessage,
          isLoading: false
        });
      }

      throw error;
    }
  },
}));