"use client";

import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

export const signOutClient = async () => {
  const supabase = createClient();
  const { setUnauthenticated } = useAuthStore.getState();

  await supabase.auth.signOut();
  setUnauthenticated();
  window.location.href = "/sign-in";
};
