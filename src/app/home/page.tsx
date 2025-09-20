'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import PlayerDashboard from './_components';
import AuthCheck from '@/Components/AuthCheck';
import { useDispatch } from 'react-redux';

const PlayerCardSection: React.FC = () => {  
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    // Try to recover auth data from multiple sources
    const recoverAuthData = () => {
      console.log('[HOME] Attempting to recover auth data...');
      
      // 1. First try localStorage
      const storedAuthData = window.localStorage.getItem('authData');
      
      // 2. If not in localStorage, try sessionStorage
      const sessionAuthData = !storedAuthData ? window.sessionStorage.getItem('authData') : null;
      
      // 3. If not in storage, check URL fragment (our backup method)
      let fragmentAuthData = null;
      if (typeof window !== 'undefined' && window.location.hash.includes('#auth=')) {
        const fragment = window.location.hash.split('#auth=')[1];
        if (fragment) {
          try {
            fragmentAuthData = decodeURIComponent(fragment);
            // Clear the fragment from URL for security
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (e) {
            console.error('[HOME] Failed to parse auth fragment:', e);
          }
        }
      }
      
      // Use the first available auth data source
      const authDataStr = storedAuthData || sessionAuthData || fragmentAuthData;
      
      if (authDataStr) {
        try {
          const authData = JSON.parse(authDataStr);
          
          // Save this to localStorage if it came from elsewhere
          if (!storedAuthData) {
            window.localStorage.setItem('authData', authDataStr);
            window.localStorage.setItem('isAuthenticated', 'true');
            window.localStorage.setItem('user', JSON.stringify(authData.user));
            window.localStorage.setItem('userData', JSON.stringify(authData.userData));
          }
          
          // Set the cookie if it's missing
          if (!Cookies.get('token') && authData.token) {
            Cookies.set('token', authData.token, { 
              expires: 30,
              path: '/',
              sameSite: 'lax'
            });
          }
          
          // Update Redux store
          dispatch({
            type: 'auth/loginSuccess',
            payload: {
              user: authData.user,
              userData: authData.userData,
              isAuthenticated: true
            }
          });
          
          console.log('[HOME] Auth data recovered and restored successfully!');
          return true;
        } catch (e) {
          console.error('[HOME] Failed to parse or restore auth data:', e);
        }
      }
      
      return false;
    };
    
    // Run the recovery function
    const recovered = recoverAuthData();
    
    // If recovery failed, check if we should redirect to login
    if (!recovered) {
      console.log('🚨 HOME PAGE - Could not recover auth data!');
      
      // Uncomment this if you want to redirect to login when auth fails
      // setTimeout(() => router.replace('/'), 500);
    }
  }, [dispatch, router]);

  return (
    <>
      <AuthCheck />
      <PlayerDashboard/>
    </>
  );
};

export default PlayerCardSection;

// Check your providers.tsx or layout.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  // Create a new store for each request
  const store = makeStore();
  
  return <Provider store={store}>{children}</Provider>;
}
