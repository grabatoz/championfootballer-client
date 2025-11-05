'use client';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { initializeFromStorage } from '@/lib/features/authSlice';
import type { AppDispatch } from '@/lib/store';
import Cookies from 'js-cookie';

export default function AuthCheck() {
  const dispatch = useDispatch<AppDispatch>();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Add storage event listener to handle changes from other tabs
    const handleStorageChange = () => {
      dispatch(initializeFromStorage());
    };
    window.addEventListener('storage', handleStorageChange);

    // Initialize from storage before checking auth
    setTimeout(() => {
      try {
        // Explicitly dispatch the action
        dispatch({
          type: 'auth/initializeFromStorage'
        });

        console.log('💾 Auth initialization complete');
      } catch (err) {
        console.error('Failed to initialize auth from storage:', err);
      }
    }, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [dispatch]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🔍 Auth Check - localStorage:', {
        user: !!localStorage.getItem('user'),
        userData: !!localStorage.getItem('userData'),
        isAuthenticated: localStorage.getItem('isAuthenticated'),
        token: !!Cookies.get('token'),
      });
    }
  }, []);

  // Return null during SSR and initial client render
  if (!isClient) {
    return null;
  }

  return null;
}