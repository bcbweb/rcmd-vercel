"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
import { ProfileInitializing } from "@/components/loading-states/profile-initializing";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, userId, setAuthenticated } = useAuthStore();
  const { initialized, fetchProfile } = useProfileStore();
  const searchParams = useSearchParams();
  const isSignInRedirect = searchParams.get("from") === "signin";
  const sessionVerified = useRef(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);
  const loadingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Verify session directly if needed
  useEffect(() => {
    // Only run once per component lifecycle
    if (sessionVerified.current || isVerifyingSession) {
      return;
    }

    // Verify even if we have userId but especially verify if we don't
    setIsVerifyingSession(true);

    // Double-check authentication with Supabase directly
    const verifySession = async () => {
      try {
        console.log(
          "Protected layout - Verifying session directly with Supabase",
          { userId, status }
        );
        const supabase = createClient();
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          setIsVerifyingSession(false);
          return;
        }

        if (data.session) {
          console.log(
            "Protected layout - Session found directly from Supabase!",
            data.session.user.id
          );
          // If we have a session but auth store doesn't match, update it
          if (data.session.user.id && (!userId || status !== "authenticated")) {
            console.log("Updating auth store with verified session");
            setAuthenticated(data.session.user.id);
          }
        }

        sessionVerified.current = true;
        setIsVerifyingSession(false);
      } catch (err) {
        console.error("Error verifying session:", err);
        setIsVerifyingSession(false);
      }
    };

    verifySession();

    // Set a timeout to avoid waiting forever for session verification
    loadingTimeout.current = setTimeout(() => {
      if (!sessionVerified.current) {
        console.log("Session verification timeout - continuing anyway");
        sessionVerified.current = true;
        setIsVerifyingSession(false);
      }
    }, 5000);

    return () => {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
    };
  }, [userId, status, setAuthenticated, isVerifyingSession]);

  // Debug logging
  useEffect(() => {
    console.log(
      "Protected layout - auth status:",
      status,
      "userId:",
      userId,
      "profile init:",
      initialized,
      "isSignInRedirect:",
      isSignInRedirect,
      "sessionVerified:",
      sessionVerified.current,
      "isVerifyingSession:",
      isVerifyingSession
    );
  }, [status, userId, initialized, isSignInRedirect, isVerifyingSession]);

  // If authenticated but profile not yet initialized,
  // try to fetch the profile
  useEffect(() => {
    if (status === "authenticated" && userId && !initialized) {
      fetchProfile(userId).catch((err) => {
        console.error("Error fetching profile:", err);
      });
    }
  }, [status, userId, initialized, fetchProfile]);

  // Show initializing screen while loading
  // But add a timeout to avoid an infinite loading state
  useEffect(() => {
    // If we're still loading after 10 seconds, log the issue
    if (status !== "authenticated" || !initialized) {
      const timer = setTimeout(() => {
        console.warn("Protected layout is still loading after 10 seconds", {
          status,
          userId,
          initialized,
        });
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [status, userId, initialized]);

  // Only show loading state if:
  // 1. We're not authenticated yet OR
  // 2. Profile is not initialized
  // 3. But skip if we're coming from sign-in to avoid flash
  if ((status !== "authenticated" || !initialized) && !isSignInRedirect) {
    return <ProfileInitializing />;
  }

  // Render children once authenticated and profile is initialized
  // or if we're coming from sign-in (to avoid loading flashes)
  return <>{children}</>;
}
