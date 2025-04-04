"use client";

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AuthState {
  userId: string | null;
  isInitialized: boolean;
  setUserId: (id: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      userId: null,
      isInitialized: false,
      setUserId: (id) => set({
        userId: id,
        isInitialized: true
      }, false, 'auth/setUserId'),
      clearAuth: () => set({
        userId: null,
        isInitialized: true
      }, false, 'auth/clear')
    }),
    { name: 'Auth Store' }
  )
);