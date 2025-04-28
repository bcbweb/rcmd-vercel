"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { Profile } from "@/types";

interface ProfileFeedProps {
  currentHandle: string;
}

export function ProfileFeed({ currentHandle }: ProfileFeedProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      if (!currentHandle) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log("[DEBUG] Fetching profile for handle:", currentHandle);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("handle", currentHandle)
          .single();

        if (error) throw error;

        if (data) {
          console.log("[DEBUG] Found profile:", data);
          setProfile(data);
        } else {
          console.log("[DEBUG] No profile found for handle:", currentHandle);
          setError("Profile not found");
        }
      } catch (error) {
        console.error("[DEBUG] Error fetching profile:", error);
        setError("Error loading profile");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [currentHandle, supabase]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="text-center">
          <p className="text-xl">{error}</p>
          <button
            onClick={() => router.push("/explore/people")}
            className="mt-4 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push("/explore/people")}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Profile</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Profile Content */}
      <div className="pt-14 pb-20 px-4 max-w-2xl mx-auto">
        <div className="min-h-[90vh] flex flex-col justify-center py-12">
          <div className="relative aspect-square w-full mb-6 rounded-xl overflow-hidden shadow-lg">
            <Image
              src={profile.profile_picture_url || "/default-avatar.png"}
              alt={profile.handle || ""}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-gray-400 text-lg">@{profile.handle}</p>
            {profile.bio && <p className="text-gray-300 mt-2">{profile.bio}</p>}

            <div className="pt-4">
              <button
                className="inline-block bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full transition-colors"
                onClick={() => router.push(`/${profile.handle}`)}
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
