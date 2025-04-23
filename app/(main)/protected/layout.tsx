"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
import { ProfileInitializing } from "@/components/loading-states/profile-initializing";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, userId } = useAuthStore();
  const { initialized } = useProfileStore();
  const searchParams = useSearchParams();
  const isSignInRedirect = searchParams.get("from") === "signin";

  useEffect(() => {
    console.log(
      "Protected layout - auth status:",
      status,
      "userId:",
      userId,
      "profile init:",
      initialized,
      "isSignInRedirect:",
      isSignInRedirect
    );
  }, [status, userId, initialized, isSignInRedirect]);

  // Don't redirect if we just came from signin (prevents redirect loops)
  if (status === "unauthenticated" && !isSignInRedirect) {
    redirect("/sign-in");
  }

  // Show initializing screen while loading
  if (status !== "authenticated" || !initialized) {
    return <ProfileInitializing />;
  }

  // Render children once authenticated and profile is initialized
  return <>{children}</>;
}
