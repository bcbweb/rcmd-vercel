import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createClient } from "@/utils/supabase/client";

interface Profile {
  profile_picture_url: string | null;
  handle: string | null;
}

interface AuthState {
  userId: string | null;
  profile: Profile | null;
  isInitialized: boolean;
  setUserId: (id: string | null) => void;
  setProfile: (profile: Profile | null) => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      userId: null,
      profile: null,
      isInitialized: false,
      setUserId: (id) => set(
        { userId: id, isInitialized: true },
        false,
        'auth/setUserId'
      ),
      setProfile: (profile) => set(
        { profile },
        false,
        'auth/setProfile'
      ),
      fetchProfile: async () => {
        const userId = get().userId;
        if (!userId) return;

        const supabase = createClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('profile_picture_url, handle')
          .eq('auth_user_id', userId)
          .single();

        set(
          { profile },
          false,
          'auth/fetchProfile'
        );
      },
    }),
    {
      name: 'Auth Store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);