"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useProfileStore } from "@/stores/profile-store";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { userId, isInitialized } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();
  const [layoutLoading, setLayoutLoading] = useState(true);

  useEffect(() => {
    // Authentication check
    if (isInitialized && !userId) {
      router.push("/sign-in");
      return;
    }

    // Only fetch profile data once when needed
    const initialize = async () => {
      if (isInitialized && userId && !profile) {
        try {
          await fetchProfile(userId);
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }

      // When initialization is complete, allow rendering the layout
      if (isInitialized) {
        setLayoutLoading(false);
      }
    };

    initialize();
  }, [userId, profile, fetchProfile, router, isInitialized]);

  const navItems = [
    { name: "Edit profile", href: "/protected/settings/profile" },
    { name: "Account management", href: "/protected/settings/account" },
  ];

  // Only show loading spinner during initial layout load
  if (layoutLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
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
