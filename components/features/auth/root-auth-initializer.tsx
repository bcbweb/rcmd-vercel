'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useProfileStore } from '@/stores/profile-store';
import { createClient } from "@/utils/supabase/client";

export function RootAuthInitializer({
  initialSession
}: {
  initialSession: { userId: string | null; };
}) {
  const { setUserId } = useAuthStore();
  const { fetchProfile, clearProfile } = useProfileStore();

  useEffect(() => {
    // Set initial state
    setUserId(initialSession.userId);
    if (initialSession.userId) {
      fetchProfile(initialSession.userId);
    }

    // Subscribe to auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUserId(null);
        clearProfile();
      } else if (session?.user?.id) {
        setUserId(session.user.id);
        await fetchProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialSession.userId, setUserId, fetchProfile, clearProfile]);

  return null;
}