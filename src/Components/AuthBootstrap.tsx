'use client';
import { useEffect } from 'react';
import { authStorage } from '@/lib/authStorage';

export default function AuthBootstrap() {
  useEffect(() => {
    const restore = () => {
      const hasCookie =
        document.cookie.includes('token=') ||
        document.cookie.includes('auth_token=');

      const haveBasics =
        localStorage.getItem('isAuthenticated') === 'true' &&
        !!localStorage.getItem('user') &&
        !!localStorage.getItem('userData');

      if (hasCookie && !haveBasics) {
        const auth = authStorage.getAuth();
        if (auth?.user && auth?.userData) {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('user', JSON.stringify(auth.user));
          localStorage.setItem('userData', JSON.stringify(auth.userData));
          if (auth.sessionExpiry)
            localStorage.setItem('sessionExpiry', auth.sessionExpiry);
        } else {
          // minimum: if cookie exists, keep isAuthenticated true
          localStorage.setItem('isAuthenticated', 'true');
        }
      }
    };

    // Run immediately and for a short window after mount
    restore();
    const t0 = setTimeout(restore, 150);
    const t1 = setTimeout(restore, 350);
    const t2 = setTimeout(restore, 700);
    const t3 = setTimeout(restore, 1200);

    return () => {
      clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    };
  }, []);

  return null;
}