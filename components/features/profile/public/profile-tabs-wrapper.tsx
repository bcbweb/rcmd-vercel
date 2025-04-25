import { useProfileStore } from "@/stores/profile-store";
import { useEffect } from "react";

// This component monitors profile store updates and helps debug profile issues
export function ProfileTabsWrapper() {
  // Access lastFetchTimestamp to detect profile changes
  const lastFetchTimestamp = useProfileStore(
    (state) => state.lastFetchTimestamp
  );
  const profile = useProfileStore((state) => state.profile);

  // Log debug info when profile changes
  useEffect(() => {
    if (profile?.id) {
      console.log("[ProfileTabsWrapper] Profile updated:", {
        id: profile.id,
        handle: profile.handle,
        defaultPageType: profile.default_page_type,
        defaultPageId: profile.default_page_id,
        timestamp: new Date(lastFetchTimestamp).toISOString(),
      });
    }
  }, [lastFetchTimestamp, profile]);

  // Component doesn't render anything
  return null;
}
