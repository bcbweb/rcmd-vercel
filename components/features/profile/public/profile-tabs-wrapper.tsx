import { useProfileStore } from "@/stores/profile-store";

// This component monitors profile store updates
export function ProfileTabsWrapper() {
  // Access lastFetchTimestamp to detect profile changes
  // This is enough to subscribe to store updates
  useProfileStore((state) => state.lastFetchTimestamp);

  // Component doesn't render anything
  return null;
}
