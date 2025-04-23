"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

interface AuthState {
  userId: string | null;
  status: AuthStatus;
  error: string | null;
  lastActivity: number;

  // Actions
  startInitialization: () => void;
  setAuthenticated: (userId: string) => void;
  setUnauthenticated: () => void;
  setError: (error: string) => void;
  resetError: () => void;
  updateActivity: () => void;
  // For debug purposes
  forceServerAuth: (userId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        userId: null,
        status: "idle",
        error: null,
        lastActivity: Date.now(),

        startInitialization: () => {
          set({ status: "loading", error: null });
        },

        setAuthenticated: (userId: string) => {
          console.log("Auth Store: Setting authenticated with userId:", userId);
          set({
            userId,
            status: "authenticated",
            lastActivity: Date.now(),
            error: null,
          });
        },

        setUnauthenticated: () => {
          console.log("Auth Store: Setting unauthenticated");
          set({
            userId: null,
            status: "unauthenticated",
            error: null,
          });
        },

        setError: (error: string) => {
          console.error("Auth Store: Setting error:", error);
          set({ error, status: "error" });
        },

        resetError: () => {
          set({ error: null, status: "idle" });
        },

        updateActivity: () => {
          set({ lastActivity: Date.now() });
        },

        // This bypasses all checks and directly sets auth state - useful for server-provided auth
        forceServerAuth: (userId: string) => {
          console.log("Auth Store: FORCE SERVER AUTH with userId:", userId);
          set({
            userId,
            status: "authenticated",
            lastActivity: Date.now(),
            error: null,
          });
        },
      }),
      {
        name: "auth-storage",
        // Only persist the minimum necessary, and don't let persisted
        // auth state override current state during hydration
        partialize: (state) => ({
          userId: state.userId,
          lastActivity: state.lastActivity,
        }),
      }
    ),
    { name: "Auth Store" }
  )
);
