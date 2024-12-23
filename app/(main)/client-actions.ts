"use client";

import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from '@/stores/auth-store';

export const signOutClient = async () => {
  const supabase = createClient();
  const { setUserId, setProfile } = useAuthStore.getState();

  await supabase.auth.signOut();
  setUserId(null);
  setProfile(null);
  window.location.href = '/sign-in';
};