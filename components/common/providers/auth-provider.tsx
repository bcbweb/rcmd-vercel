"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function AuthProvider({
  children,
  serverUserId,
}: {
  children: React.ReactNode;
  serverUserId: string | null;
}) {
  const {
    status,
    userId,
    startInitialization,
    setAuthenticated,
    setUnauthenticated,
    setError,
    forceServerAuth,
  } = useAuthStore();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastAuthTime = useRef<number>(Date.now());
  const redirectAttempts = useRef<number>(0);
  const lastPathChecked = useRef<string>("");
  const [sessionChecked, setSessionChecked] = useState(false);

  // CRITICAL: Force authentication immediately from server props
  // This needs to run synchronously during component mount
  useEffect(() => {
    // Only run this once and make sure we apply the server state immediately
    if (serverUserId) {
      console.log("***FORCE SERVER AUTH*** User ID:", serverUserId);
      // Directly set authenticated without waiting
      forceServerAuth(serverUserId);
      lastAuthTime.current = Date.now();
    } else if (status === "idle") {
      // Only set to unauthenticated if we don't have a server user and we're still in idle state
      console.log("***FORCE SERVER UNAUTH*** No server user ID");
      setUnauthenticated();
    }
  }, [serverUserId, forceServerAuth, setUnauthenticated, status]);

  // Check if this is a redirect after sign-in
  const isSignInRedirect = searchParams.get("from") === "signin";

  // Track current URL to prevent unnecessary redirects
  const currentUrl =
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  // More careful approach to session verification - this combines several auth approaches
  // to create a more resilient auth check
  useEffect(() => {
    // Run on first mount and when authentication state changes
    const verifySession = async () => {
      console.log("Running session verification check");

      // Don't duplicate checks in a session since the Supabase auth is already verified on server
      if (sessionChecked && userId) {
        return;
      }

      try {
        // Make sure we're properly initialized first
        const supabase = createClient();
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error verifying session:", error);
          // Don't immediately unauthenticate on error - just log it
          return;
        }

        // If we have a session but our auth store doesn't reflect it, fix that
        if (data.session?.user?.id && status !== "authenticated") {
          console.log(
            "Session found but not in auth store - updating auth store"
          );
          setAuthenticated(data.session.user.id);
          lastAuthTime.current = Date.now();
        }

        // Mark that we've checked the session
        setSessionChecked(true);
      } catch (err) {
        console.error("Error in session verification:", err);
      }
    };

    verifySession();

    // Set up interval to re-verify the session every minute
    const intervalId = setInterval(verifySession, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [userId, status, setAuthenticated, sessionChecked]);

  // Handle redirects based on auth state and current path
  useEffect(() => {
    // Skip if we're checking the same path again
    if (lastPathChecked.current === currentUrl) {
      return;
    }

    lastPathChecked.current = currentUrl;

    // Prevent redirect loops - if we've redirected too many times in a short period
    if (redirectAttempts.current > 3) {
      console.error("Too many redirect attempts detected - breaking loop");
      redirectAttempts.current = 0;
      return;
    }

    // Don't redirect if we're already redirecting
    if (isRedirecting) {
      return;
    }

    // Don't redirect if we just came from sign-in
    if (isSignInRedirect) {
      console.log("Skipping redirect - this is a sign-in redirect");
      return;
    }

    // Don't redirect too frequently after authentication
    if (Date.now() - lastAuthTime.current < 10000) {
      console.log("Skipping redirect - authentication was too recent");
      return;
    }

    // Add a longer delay to allow auth state to stabilize
    const redirectTimeout = setTimeout(() => {
      console.log(
        "Checking for redirect needs - status:",
        status,
        "pathname:",
        pathname
      );

      // Handle the redirect to profile area if on sign-in page
      if (status === "authenticated" && pathname.startsWith("/sign-in")) {
        redirectAttempts.current += 1;
        setIsRedirecting(true);
        console.log("Redirecting to protected area after sign in");
        router.push("/protected/profile");
      }
      // EVEN MORE CAUTIOUS redirect to sign-in only if:
      // 1. Status is explicitly unauthenticated (not loading/idle/error)
      // 2. We're on a protected path
      // 3. Not a sign-in redirect
      // 4. We've properly checked the session first
      // 5. We've attempted to verify the session at least once
      else if (
        sessionChecked &&
        status === "unauthenticated" &&
        pathname.startsWith("/protected") &&
        !isSignInRedirect &&
        Date.now() - lastAuthTime.current > 30000 && // Increased from 15000
        redirectAttempts.current === 0 // Only try once per path to avoid loops
      ) {
        redirectAttempts.current += 1;
        setIsRedirecting(true);
        console.log("Redirecting to sign in page");
        router.push("/sign-in");
      }
    }, 3000); // Increased delay from 2000 to 3000ms to allow more time for state to stabilize

    return () => clearTimeout(redirectTimeout);
  }, [
    status,
    router,
    pathname,
    isRedirecting,
    isSignInRedirect,
    currentUrl,
    sessionChecked,
  ]);

  // Initialize auth from client session only if we don't already have auth from server
  useEffect(() => {
    const initializeAuth = async () => {
      // Skip if we already have auth information from the server
      if (userId || status !== "idle") {
        console.log("Skipping client auth - we already have auth info", {
          status,
          userId,
        });
        return;
      }

      try {
        startInitialization();
        console.time("authInitialization");

        const supabase = createClient();
        console.log("AuthProvider - Getting session from client...");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting auth session:", error);
          throw error;
        }

        if (session) {
          console.log("AuthProvider - Client session found:", session.user.id);
          setAuthenticated(session.user.id);
          lastAuthTime.current = Date.now();
        } else {
          console.log("AuthProvider - No client session found");
          setUnauthenticated();
        }

        console.timeEnd("authInitialization");

        // Set up auth state change listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          console.log(
            "Auth state changed:",
            event,
            session ? `User: ${session.user.id}` : "No session"
          );
          if (event === "SIGNED_IN" && session) {
            setAuthenticated(session.user.id);
            lastAuthTime.current = Date.now();
            redirectAttempts.current = 0; // Reset redirect attempts on sign in
          } else if (event === "SIGNED_OUT") {
            setUnauthenticated();
          }
        });

        // Add timeout protection
        const timeout = setTimeout(() => {
          if (useAuthStore.getState().status === "loading") {
            console.error("Auth initialization timed out after 10 seconds");
            setError("Authentication initialization timed out");
          }
        }, 10000);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timeout);
        };
      } catch (err) {
        console.error("Auth initialization error:", err);
        setError(
          err instanceof Error ? err.message : "Unknown authentication error"
        );
      }
    };

    initializeAuth();
  }, [
    status,
    userId,
    startInitialization,
    setAuthenticated,
    setUnauthenticated,
    setError,
  ]);

  return children;
}
