'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import PlayerDashboard from './_components';
import AuthCheck from '@/Components/AuthCheck';
import { useAppDispatch } from '@/lib/hooks';
import { authStorage, type UserProfile, type UserDataShape } from '@/lib/authStorage';
import HomeDashboardLoadingSkeleton from '@/Components/loading/HomeDashboardLoadingSkeleton';

// Define proper interfaces matching your auth storage
interface AuthData {
  user: UserProfile;
  userData: UserDataShape;
  token: string;
  isAuthenticated: boolean;
}

const PlayerCardSection: React.FC = () => {  
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [authReady, setAuthReady] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    // Try to recover auth data from multiple sources
    const recoverAuthData = async (): Promise<boolean> => {
      console.log('[HOME] Attempting to recover auth data...');
      
      // ✨ Wait a bit for cookies to be properly set from login page
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 1. First try localStorage
      const storedAuthData = window.localStorage.getItem('authData');
      
      // 2. If not in localStorage, try sessionStorage
      const sessionAuthData = !storedAuthData ? window.sessionStorage.getItem('authData') : null;
      
      // 3. If not in storage, check URL fragment (our backup method)
      let fragmentAuthData: string | null = null;
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
          const authData = JSON.parse(authDataStr) as AuthData;
          
          // Save this to localStorage if it came from elsewhere using authStorage
          if (!storedAuthData && authData.user && authData.userData && authData.token) {
            authStorage.saveAuthExact(authData.user, authData.userData, authData.token);
          }
          
          // Set the cookie if it's missing
          if (!Cookies.get('token') && authData.token) {
            console.log('[HOME] ✅ Restoring token to cookies');
            Cookies.set('token', authData.token, { 
              expires: 365,
              path: '/',
              sameSite: 'lax'
            });
            Cookies.set('auth_token', authData.token, { 
              expires: 365,
              path: '/',
              sameSite: 'lax'
            });
          }
          
          // Verify token availability from cookie first, then storage fallback
          const verifyToken =
            Cookies.get('token') ||
            Cookies.get('auth_token') ||
            window.localStorage.getItem('token') ||
            authData.token;
          console.log('[HOME] Token verification:', {
            hasToken: !!verifyToken,
            tokenLength: verifyToken?.length
          });
          
          // ✨ Wait extra time for cookie to be fully accessible
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Double check token is now available (cookie or storage fallback)
          const finalToken =
            Cookies.get('token') ||
            Cookies.get('auth_token') ||
            window.localStorage.getItem('token');
          if (finalToken) {
            console.log('[HOME] ✅ Token confirmed ready!');
            setTokenReady(true);
          } else {
            // Last fallback: ask unified auth storage to restore again
            const recovered = authStorage.getAuth();
            const recoveredToken = recovered?.token || window.localStorage.getItem('token');
            if (recoveredToken) {
              setTokenReady(true);
              console.warn('[HOME] Token recovered via storage fallback after wait.');
            } else {
              // Avoid hard error noise and loading deadlock; auth guards can handle unauth state.
              setTokenReady(true);
              console.warn('[HOME] Token not accessible after wait; continuing with auth fallback flow.');
            }
          }
          
          // Use the initializeFromStorage action instead of manual dispatch
          import('@/lib/features/authSlice').then(({ initializeFromStorage }) => {
            dispatch(initializeFromStorage());
          });
          
          console.log('[HOME] ✅ Auth data recovered and restored successfully!');
          return true;
        } catch (e) {
          console.error('[HOME] Failed to parse or restore auth data:', e);
        }
      }
      
      return false;
    };
    
    // Run the recovery function
    recoverAuthData().then(recovered => {
      if (!recovered) {
        console.log('🚨 HOME PAGE - Could not recover auth data!');
        // Uncomment this if you want to redirect to login when auth fails
        // setTimeout(() => router.replace('/'), 500);
      }
      
      // ✨ Mark auth as ready regardless, so component can render
      setAuthReady(true);
    });
  }, [dispatch, router]);

  // ✨ Show loading while auth OR token is not ready
  if (!authReady || !tokenReady) {
    return <HomeDashboardLoadingSkeleton />;
  }

  return (
    <>
      <AuthCheck />
      <PlayerDashboard/>
    </>
  );
};

export default PlayerCardSection;

// Check your providers.tsx or layout.tsx
// export function Providers({ children }: { children: React.ReactNode }) {
//   // Create a new store for each request
//   const store = makeStore();
  
//   return <Provider store={store}>{children}</Provider>;
// }
