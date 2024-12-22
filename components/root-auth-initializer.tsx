'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from "@/utils/supabase/client";

export function RootAuthInitializer({
  initialSession
}: {
  initialSession: { userId: string | null; };
}) {
  const { setUserId, fetchProfile } = useAuthStore();

  useEffect(() => {
    // Set initial state
    setUserId(initialSession.userId);
    if (initialSession.userId) {
      fetchProfile();
    }

    // Subscribe to auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUserId(null);
      } else if (session?.user) {
        setUserId(session.user.id);
        await fetchProfile();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialSession.userId, setUserId, fetchProfile]);

  return null;
}