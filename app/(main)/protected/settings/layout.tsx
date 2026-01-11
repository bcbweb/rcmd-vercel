"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/stores/profile-store";
import { ProfileInitializing } from "@/components/loading-states/profile-initializing";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { userId, status } = useAuthStore();
  const { profile, fetchProfile, initialized } = useProfileStore();
  const [layoutLoading, setLayoutLoading] = useState(true);

  useEffect(() => {
    // Authentication check
    if (status === "unauthenticated") {
      router.push("/sign-in");
      return;
    }

    // Only fetch profile data once when needed
    const initialize = async () => {
      if (status === "authenticated" && userId && !profile) {
        try {
          await fetchProfile(userId);
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }

      // When authentication is determined and profile is initialized, allow rendering the layout
      if (status !== "idle" && status !== "loading" && initialized) {
        setLayoutLoading(false);
      }
    };

    initialize();
  }, [userId, profile, fetchProfile, router, status, initialized]);

  // Log state for debugging
  useEffect(() => {
    console.log(
      "Settings layout - auth status:",
      status,
      "userId:",
      userId,
      "profile init:",
      initialized,
      "layoutLoading:",
      layoutLoading
    );
  }, [status, userId, initialized, layoutLoading]);

  const navItems = [
    { name: "Edit profile", href: "/protected/settings/profile" },
    { name: "Account management", href: "/protected/settings/account" },
    { name: "Subscription", href: "/protected/settings/subscription" },
  ];

  // Show the same initializing component as other layouts
  if (status !== "authenticated" || !initialized || layoutLoading) {
    return <ProfileInitializing />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800">
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block px-4 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto p-6">{children}</div>
      </div>
    </div>
  );
}
