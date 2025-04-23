"use client";

import { useEffect, useState } from "react";
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

  // CRITICAL: Force authentication immediately from server props
  // This needs to run synchronously during component mount
  useEffect(() => {
    // Only run this once and make sure we apply the server state immediately
    if (serverUserId) {
      console.log("***FORCE SERVER AUTH*** User ID:", serverUserId);
      // Directly set authenticated without waiting
      forceServerAuth(serverUserId);
    } else if (status === "idle") {
      // Only set to unauthenticated if we don't have a server user and we're still in idle state
      console.log("***FORCE SERVER UNAUTH*** No server user ID");
      setUnauthenticated();
    }
  }, [serverUserId, forceServerAuth, setUnauthenticated, status]);

  // Check if this is a redirect after sign-in
  const isSignInRedirect = searchParams.get("from") === "signin";

  // Handle redirects based on auth state and current path
  useEffect(() => {
    // Don't redirect if we're already redirecting or if this is a redirect from sign-in
    // The isSignInRedirect check prevents redirect loops right after authentication
    if (isRedirecting || isSignInRedirect) {
      console.log("Skipping redirect - already redirecting or after sign-in");
      return;
    }

    // Add a small delay to allow auth state to stabilize
    const redirectTimeout = setTimeout(() => {
      if (status === "authenticated" && pathname.startsWith("/sign-in")) {
        setIsRedirecting(true);
        console.log("Redirecting to protected area after sign in");
        router.push("/protected/profile");
      } else if (
        status === "unauthenticated" &&
        pathname.startsWith("/protected") &&
        !isSignInRedirect
      ) {
        setIsRedirecting(true);
        console.log("Redirecting to sign in page");
        router.push("/sign-in");
      }
    }, 500);

    return () => clearTimeout(redirectTimeout);
  }, [status, router, pathname, isRedirecting, isSignInRedirect]);

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
