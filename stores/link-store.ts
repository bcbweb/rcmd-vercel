"use client";

import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
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
    visibility: string
  ) => Promise<Link | null>;
  fetchLinks: (userId?: string) => Promise<void>;
  deleteLink: (id: string, skipConfirmation?: boolean) => Promise<void>;
  updateLink: (id: string, updates: Partial<Link>) => Promise<void>;
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

      set((state) => ({
        links: [data[0] as Link, ...state.links],
        isLoading: false
      }));

      return data[0] as Link;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to insert link';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  fetchLinks: async (userId?: string) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      let query = supabase
        .from('links')
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

      set({ links: data || [], isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch links';
      set({ error: errorMessage, isLoading: false });
    }
  },

  deleteLink: async (id: string) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { error: linkError } = await supabase
        .from('links')
        .delete()
        .eq('id', id);

      if (linkError) throw linkError;

      set(state => ({
        links: state.links.filter(link => link.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete link'
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

      const { error } = await supabase
        .from('links')
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
        : 'Failed to update link';

      // Revert optimistic update on error
      const { data } = await supabase
        .from('links')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        set((state) => ({
          error: errorMessage,
          isLoading: false,
          links: state.links.map((link) =>
            link.id === id
              ? data as Link
              : link
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
