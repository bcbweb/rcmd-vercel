"use client";

import Link from "next/link";
import {
  Settings,
  LogOut,
  ArrowLeftRight,
  Rows3,
  SquarePlus,
  LayoutDashboard,
  Eye,
} from "lucide-react";
import { signOutClient } from "@/app/(main)/client-actions";
import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AddMenu from "@/components/common/add-menu";
import { useEffect } from "react";

// Separate component for auth buttons to reuse in mobile menu
export function AuthButtons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Link
        href="/sign-in"
        className="text-sm font-medium text-muted-foreground hover:text-primary"
      >
        Sign in
      </Link>
      <Link
        href="/sign-up"
        className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
      >
        Sign up
      </Link>
    </div>
  );
}

export default function UserMenu() {
  const { status, userId } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    if (userId && !profile) {
      console.log("UserMenu - Fetching profile for userId:", userId);
      fetchProfile(userId).catch((err) => {
        console.error("UserMenu - Error fetching profile:", err);
      });
    }
  }, [userId, profile, fetchProfile]);

  const getInitials = (name: string) => {
    return name?.substring(0, 2).toUpperCase() ?? "U";
  };

  // Show a loading placeholder until auth is determined
  if (status === "idle" || status === "loading") {
    return (
      <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
    );
  }

  // Show auth buttons for unauthenticated users
  if (status === "unauthenticated") {
    return (
      <div className="hidden md:block">
        <AuthButtons />
      </div>
    );
  }

  // Handle error state
  if (status === "error") {
    return (
      <div className="hidden md:block">
        <AuthButtons />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5">
      <AddMenu />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="outline-none">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={profile?.profile_picture_url || ""}
                alt={profile?.handle ?? "User avatar"}
              />
              <AvatarFallback>
                {profile?.handle ? getInitials(profile.handle) : "U"}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm font-medium">
              {profile?.handle ? `@${profile.handle}` : "Profile"}
            </span>
            <Link
              href="/protected/profile/switch"
              className="flex items-center text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftRight className="mr-1 h-3 w-3" />
              Switch
            </Link>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link
                href="/protected/profile"
                className="flex items-center cursor-pointer"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Profile builder
              </Link>
            </DropdownMenuItem>
            {profile?.handle && (
              <DropdownMenuItem asChild>
                <Link
                  href={`/${profile.handle}`}
                  className="flex items-center cursor-pointer"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview my profile
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link
                href="/protected/profile/rcmds"
                className="flex items-center cursor-pointer"
              >
                <Rows3 className="mr-2 h-4 w-4" />
                RCMDs
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/protected/profile/add"
                className="flex items-center cursor-pointer"
              >
                <SquarePlus className="mr-2 h-4 w-4" />
                Add profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/protected/settings"
                className="flex items-center cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={signOutClient}
            className="flex items-center cursor-pointer text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
