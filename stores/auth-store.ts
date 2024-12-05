import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AuthState {
  userId: string | null;
  setUserId: (id: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      userId: null,
      setUserId: (id) => set({ userId: id }, false, 'auth/setUserId'),
    }),
    {
      name: 'Auth Store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);