"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export function ProfileInitializing() {
  const { status, userId, resetError, startInitialization } = useAuthStore();
  const { error: profileError, initialized, retryFetch } = useProfileStore();
  const hasError = status === "error" || profileError;

  // Auto-retry profile fetch if there's a profile error but auth is working
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined = undefined;

    if (status === "authenticated" && userId && profileError) {
      timeoutId = setTimeout(() => {
        retryFetch(userId);
      }, 2000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [status, userId, profileError, retryFetch]);

  const handleRetry = () => {
    if (status === "error") {
      resetError();
      startInitialization();
    } else if (userId && profileError) {
      retryFetch(userId);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
        <p className="text-lg">Loading... Initializing your profile</p>
        <p className="text-sm text-gray-500 mt-2">
          If this takes too long, try refreshing the page
        </p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-red-500 mb-4 text-5xl">⚠️</div>
        <p className="text-lg">Unable to load your profile</p>
        <p className="text-sm text-gray-500 mt-2">
          {status === "error" ? "Authentication error" : profileError}
        </p>
        <Button onClick={handleRetry} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  // For idle state or other states where we're transitioning
  if (status !== "authenticated" || !initialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-pulse rounded-full h-12 w-12 bg-gray-200 mb-4"></div>
        <p className="text-lg text-gray-400">Preparing your profile...</p>
      </div>
    );
  }

  return null;
}
