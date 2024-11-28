"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import {
  Settings,
  LogOut,
  User as UserIcon,
  ArrowLeftRight,
  Rows3,
  SquarePlus
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AddMenu from "./add-menu";

interface Profile {
  profile_picture_url: string | null;
  handle: string | null;
}

export default function UserMenu() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('profile_picture_url, handle')
          .eq('auth_user_id', user.id)
          .single();
        setProfile(profile);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  if (!user) {
    return (
      <div className="flex items-center gap-4">
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

  return (
    <div className="flex items-center gap-5">
      <AddMenu />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="outline-none">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={profile?.profile_picture_url ?? undefined}
                alt={profile?.handle ?? user.email ?? "User avatar"}
              />
              <AvatarFallback>
                {profile?.handle ? getInitials(profile.handle) : user.email ? getInitials(user.email) : "U"}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <div className="px-2 py-1.5 text-sm font-medium">
            {profile?.handle ? `@${profile.handle}` : user.email}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/protected/profile" className="flex items-center cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                Manage profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/protected/profile/rcmds" className="flex items-center cursor-pointer">
                <Rows3 className="mr-2 h-4 w-4" />
                RCMDs
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/protected/profile/add" className="flex items-center cursor-pointer">
                <SquarePlus className="mr-2 h-4 w-4" />
                Add profile type
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/protected/profile/switchs" className="flex items-center cursor-pointer">
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Switch profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/protected/settings" className="flex items-center cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
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