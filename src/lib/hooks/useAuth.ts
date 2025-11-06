// Optimized useAuth hook with memoization
'use client';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useMemo } from 'react';

export const useAuth = () => {
  const auth = useSelector((state: RootState) => state.auth);
  
  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    user: auth.user,
    token: auth.token,
    isAuthenticated: !!auth.token && !!auth.user,
    loading: auth.loading || false,
  }), [auth.user, auth.token, auth.loading]);
};
