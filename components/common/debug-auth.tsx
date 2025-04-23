"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function DebugAuth() {
  const {
    status,
    userId,
    setAuthenticated,
    setUnauthenticated,
    forceServerAuth,
  } = useAuthStore();
  const { profile, initialized, fetchProfile } = useProfileStore();
  const [showDetails, setShowDetails] = useState(false);
  const [serverUserIdInput, setServerUserIdInput] = useState<string>(
    userId || ""
  );

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const refreshAuth = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setAuthenticated(data.session.user.id);
        if (data.session.user.id) {
          fetchProfile(data.session.user.id);
        }
        console.log("Debug: Refreshed auth with session", data.session.user.id);
      } else {
        setUnauthenticated();
        console.log("Debug: No session found during refresh");
      }
    } catch (err) {
      console.error("Debug: Auth refresh error", err);
    }
  };

  const forceAuth = () => {
    if (serverUserIdInput && serverUserIdInput.length > 10) {
      console.log("Debug: Forcing auth with ID:", serverUserIdInput);
      forceServerAuth(serverUserIdInput);

      // Also fetch profile
      fetchProfile(serverUserIdInput);
    }
  };

  return (
    <div className="fixed bottom-0 right-0 bg-black/80 text-white p-2 text-xs z-50 max-w-[300px] rounded-tl-md">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">Auth Debug</h3>
        <Button
          onClick={() => setShowDetails(!showDetails)}
          size="sm"
          variant="outline"
          className="text-[10px] h-5 py-0 px-1 text-white border-white hover:text-white"
        >
          {showDetails ? "Hide" : "Details"}
        </Button>
      </div>
      <div className="mt-1 space-y-1">
        <p>
          <span className="font-semibold">Status:</span> {status}
        </p>
        <p>
          <span className="font-semibold">User ID:</span>{" "}
          {userId ? `${userId.slice(0, 8)}...` : "null"}
        </p>
        <p>
          <span className="font-semibold">Profile Init:</span>{" "}
          {initialized ? "Yes" : "No"}
        </p>
        <p>
          <span className="font-semibold">Profile ID:</span>{" "}
          {profile?.id ? `${profile.id.slice(0, 8)}...` : "null"}
        </p>

        {showDetails && (
          <>
            {profile && (
              <div className="mt-2 bg-slate-900 p-2 rounded text-[10px]">
                <p className="text-green-400 font-bold">Profile Data:</p>
                <p>
                  Name: {profile.first_name} {profile.last_name}
                </p>
                <p>Handle: {profile.handle}</p>
                <p>Onboarded: {profile.is_onboarded ? "Yes" : "No"}</p>
              </div>
            )}
            <div className="mt-2">
              <p className="text-xs font-bold mb-1">Force Authentication:</p>
              <div className="flex gap-1 items-center">
                <input
                  type="text"
                  value={serverUserIdInput}
                  onChange={(e) => setServerUserIdInput(e.target.value)}
                  placeholder="User ID"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded h-6 px-1 text-[10px]"
                />
                <Button
                  onClick={forceAuth}
                  size="sm"
                  variant="outline"
                  className="text-[10px] h-5 py-0 px-1 bg-red-900 hover:bg-red-800 text-white border-red-700"
                >
                  Force Auth
                </Button>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                onClick={refreshAuth}
                size="sm"
                variant="outline"
                className="text-[10px] h-5 py-0 px-1 bg-blue-900 hover:bg-blue-800 text-white border-blue-700"
              >
                Refresh Auth
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
