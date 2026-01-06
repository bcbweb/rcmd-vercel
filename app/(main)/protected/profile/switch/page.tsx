"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Briefcase, Newspaper, User, Check, Plus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
        .select("id, handle, first_name, profile_picture_url, profile_type, is_onboarded")
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Switch Profile</h1>
        <p className="text-muted-foreground">
          Choose which profile you want to use. You can switch between profiles at any time.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {profiles.map((profile) => {
          const isActive = currentProfile?.id === profile.id;
          const isSwitchingThis = isSwitching === profile.id;

          return (
            <Card
              key={profile.id}
              className={`relative ${
                isActive
                  ? "ring-2 ring-primary border-primary"
                  : "hover:shadow-lg transition-shadow"
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
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
                      <CardTitle className="text-lg">
                        {profile.handle ? `@${profile.handle}` : "Unnamed Profile"}
                      </CardTitle>
                      <CardDescription>
                        {profile.first_name || "No name set"}
                      </CardDescription>
                    </div>
                  </div>
                  {isActive && (
                    <div className="flex items-center space-x-1 text-primary">
                      <Check className="h-5 w-5" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    {getProfileIcon(profile.profile_type)}
                    <span>{getProfileTypeLabel(profile.profile_type)}</span>
                  </div>
                  <Button
                    onClick={() => handleSwitchProfile(profile.id)}
                    disabled={isActive || isSwitchingThis || !!isSwitching}
                    variant={isActive ? "outline" : "default"}
                  >
                    {isSwitchingThis
                      ? "Switching..."
                      : isActive
                      ? "Current"
                      : "Switch"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Add New Profile Card */}
        <Card className="border-dashed hover:border-primary transition-colors">
          <Link href="/protected/add-profile">
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] cursor-pointer">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg mb-2">Add New Profile</CardTitle>
              <CardDescription className="text-center">
                Create a business or content creator profile
              </CardDescription>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}

