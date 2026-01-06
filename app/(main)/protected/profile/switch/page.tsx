"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Briefcase,
  Newspaper,
  User,
  Check,
  Plus,
  ArrowLeftRight,
} from "lucide-react";
import Link from "next/link";

interface Profile {
  id: string;
  handle: string | null;
  first_name: string | null;
  profile_picture_url: string | null;
  profile_type: string | null;
  is_onboarded: boolean | null;
}

export default function ProfileSwitchPage() {
  const router = useRouter();
  const { userId } = useAuthStore();
  const { profile: currentProfile, fetchProfile } = useProfileStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadProfiles();
    }
  }, [userId]);

  const loadProfiles = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const supabase = createClient();

      // Fetch all profiles for this user
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, handle, first_name, profile_picture_url, profile_type, is_onboarded"
        )
        .eq("auth_user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProfiles(data || []);
    } catch (error) {
      console.error("Error loading profiles:", error);
      toast.error("Failed to load profiles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchProfile = async (profileId: string) => {
    if (!userId) return;

    try {
      setIsSwitching(profileId);
      const supabase = createClient();

      // Set the active profile using the RPC function
      const { error } = await supabase.rpc("set_active_profile", {
        p_profile_id: profileId,
      });

      if (error) throw error;

      // Refresh the profile store
      await fetchProfile(userId);

      toast.success("Profile switched successfully");

      // Small delay to ensure state is updated
      setTimeout(() => {
        router.push("/protected/profile");
      }, 100);
    } catch (error) {
      console.error("Error switching profile:", error);
      toast.error("Failed to switch profile");
    } finally {
      setIsSwitching(null);
    }
  };

  const getProfileIcon = (type: string | null) => {
    switch (type) {
      case "business":
        return <Briefcase className="h-5 w-5" />;
      case "creator":
        return <Newspaper className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const getProfileTypeLabel = (type: string | null) => {
    switch (type) {
      case "business":
        return "Business";
      case "creator":
        return "Content Creator";
      case "default":
        return "Personal";
      default:
        return "Personal";
    }
  };

  const getInitials = (name: string | null, handle: string | null) => {
    if (name) {
      return name.substring(0, 2).toUpperCase();
    }
    if (handle) {
      return handle.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-32 w-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-2">
              <ArrowLeftRight className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Switch Profile
              </h2>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Choose which profile you want to use. You can switch between
              profiles at any time.
            </p>
          </div>

          <div className="p-6 space-y-4">
            {profiles.map((profile) => {
              const isActive = currentProfile?.id === profile.id;
              const isSwitchingThis = isSwitching === profile.id;

              return (
                <div
                  key={profile.id}
                  className={`border rounded-lg p-6 transition-all ${
                    isActive
                      ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={profile.profile_picture_url || ""}
                          alt={profile.handle || "Profile"}
                        />
                        <AvatarFallback>
                          {getInitials(profile.first_name, profile.handle)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {profile.handle
                            ? `@${profile.handle}`
                            : "Unnamed Profile"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {profile.first_name || "No name set"}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="text-gray-400 dark:text-gray-500">
                            {getProfileIcon(profile.profile_type)}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {getProfileTypeLabel(profile.profile_type)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {isActive && (
                        <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                          <Check className="h-5 w-5" />
                          <span className="text-sm font-medium">Active</span>
                        </div>
                      )}
                      <Button
                        onClick={() => handleSwitchProfile(profile.id)}
                        disabled={isActive || isSwitchingThis || !!isSwitching}
                        variant={isActive ? "outline" : "default"}
                        className={
                          isActive
                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                            : ""
                        }
                      >
                        {isSwitchingThis
                          ? "Switching..."
                          : isActive
                            ? "Current"
                            : "Switch"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add New Profile Card */}
            <Link href="/protected/add-profile">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 cursor-pointer transition-all hover:border-blue-500 dark:hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex flex-col items-center justify-center">
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                    <Plus className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    Add New Profile
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Create a business or content creator profile
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 p-6">
            <Link
              href="/protected/profile"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
