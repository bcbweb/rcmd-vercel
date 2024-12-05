'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function InitAuthStore({ userId }: { userId: string; }) {
  const setUserId = useAuthStore(state => state.setUserId);

  useEffect(() => {
    setUserId(userId);
  }, [userId, setUserId]);

  return null;
}