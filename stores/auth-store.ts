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
  lastAuthTime: number;

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
        lastAuthTime: 0,

        startInitialization: () => {
          set({ status: "loading", error: null });
        },

        setAuthenticated: (userId: string) => {
          const timestamp = Date.now();
          set({
            userId,
            status: "authenticated",
            lastActivity: timestamp,
            lastAuthTime: timestamp,
            error: null,
          });
        },

        setUnauthenticated: () => {
          // Don't clear userId immediately after authentication
          const state = get();
          const timeSinceAuth = Date.now() - state.lastAuthTime;

          // If we authenticated recently (last 10 seconds), don't unauthenticate
          // This prevents race conditions during initialization
          if (state.status === "authenticated" && timeSinceAuth < 10000) {
            return;
          }

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
          const timestamp = Date.now();
          set({
            userId,
            status: "authenticated",
            lastActivity: timestamp,
            lastAuthTime: timestamp,
            error: null,
          });
        },
      }),
      {
        name: "auth-storage",
        // Persist more state information to maintain auth better between reloads
        partialize: (state) => ({
          userId: state.userId,
          status: state.status === "authenticated" ? "authenticated" : "idle",
          lastActivity: state.lastActivity,
          lastAuthTime: state.lastAuthTime,
        }),
        // Ensure auth storage persists correctly
        storage: {
          getItem: (name) => {
            const storedValue = localStorage.getItem(name);
            return storedValue ? JSON.parse(storedValue) : null;
          },
          setItem: (name, value) => {
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          },
        },
      }
    ),
    { name: "Auth Store" }
  )
);
