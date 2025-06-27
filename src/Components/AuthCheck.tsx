'use client';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuth, initializeFromStorage } from '@/lib/features/authSlice';
import { AppDispatch } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { AuthResponse } from '@/types/user';

export default function AuthCheck() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Initialize from storage first
    dispatch(initializeFromStorage());

    const checkAuthentication = async () => {
      try {
        const result = await dispatch(checkAuth()) as { payload: AuthResponse };
        if (!result.payload?.success) {
          router.push('/');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/');
      }
    };

    checkAuthentication();
  }, [dispatch, router]);

  // Return null during SSR and initial client render
  if (!isClient) {
    return null;
  }

  return null;
} 