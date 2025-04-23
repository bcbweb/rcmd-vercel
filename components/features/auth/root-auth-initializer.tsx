"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";

export function RootAuthInitializer({
  initialSession,
}: {
  initialSession: { userId: string | null };
}) {
  const { userId, status, setAuthenticated, setUnauthenticated } =
    useAuthStore();
  const { fetchProfile } = useProfileStore();
  const [authInitialized, setAuthInitialized] = useState(false);

  // Handle initial auth state from server
  useEffect(() => {
    if (authInitialized) return;

    console.log(
      "RootAuthInitializer: Initializing with session",
      initialSession
    );

    // Set initial state based on server-side session
    if (initialSession.userId) {
      console.log("Setting authenticated with userId:", initialSession.userId);
      setAuthenticated(initialSession.userId);
    } else {
      console.log("Setting unauthenticated - no userId in session");
      setUnauthenticated();
    }

    setAuthInitialized(true);
  }, [initialSession, setAuthenticated, setUnauthenticated, authInitialized]);

  // Fetch profile when auth is complete
  useEffect(() => {
    // Only fetch profile when we have a confirmed authenticated status
    if (status !== "authenticated" || !userId) {
      return;
    }

    console.log("RootAuthInitializer: Fetching profile for user:", userId);

    // Fetch the profile
    fetchProfile(userId)
      .then((result) => {
        console.log("RootAuthInitializer: Profile fetch complete:", result);
      })
      .catch((err) => {
        console.error("RootAuthInitializer: Error fetching profile:", err);
      });
  }, [status, userId, fetchProfile]);

  return null;
}
