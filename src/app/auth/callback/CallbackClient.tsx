'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeJwt } from '@/lib/auth';
import Cookies from 'js-cookie';

const API = process.env.NEXT_PUBLIC_API_URL;

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState('Processing login...');

  useEffect(() => {
    (async () => {
      try {
        // 1. Get token from URL params
        const token = searchParams?.get('token');
        const next = searchParams?.get('next') || '/home';
        
        if (!token) {
          console.error('[CALLBACK] No token found in URL');
          router.replace('/');
          return;
        }

        // 2. Decode token to get expiry
        let exp = 0;
        try {
          const decoded = decodeJwt(token);
          if (decoded?.exp && typeof decoded.exp === 'number') {
            exp = decoded.exp;
          }
        } catch (e) {
          console.warn('[CALLBACK] Token decode failed:', e);
        }

        // 3. Set cookies immediately 
        const secure = window.location.protocol === 'https:';
        const attrs = `; Path=/; SameSite=Lax; Max-Age=604800${secure ? '; Secure' : ''}`;
        document.cookie = `token=${token}${attrs}`;
        document.cookie = `auth_token=${token}${attrs}`;
        
        // Also use js-cookie for consistency
        Cookies.set('token', token, { expires: 7, path: '/' });

        // 4. Set basic auth state in localStorage immediately
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('sessionExpiry', new Date(exp * 1000).toISOString());

        setMsg('Loading your profile...');

        // 5. Fetch COMPLETE user data from /auth/data (this includes leagues, matches, etc.)
        let completeUserData = null;
        if (API) {
          try {
            console.log('[CALLBACK] Fetching complete user data from:', `${API}/auth/data`);
            const res = await fetch(`${API}/auth/data`, {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              cache: 'no-store',
              mode: 'cors',
            });
            
            if (res.ok) {
              const payload = await res.json();
              completeUserData = payload?.user ?? null;
              console.log('[CALLBACK] ✓ Complete user data fetched:', {
                hasUser: !!completeUserData,
                userId: completeUserData?.id,
                userEmail: completeUserData?.email,
                hasLeagues: completeUserData?.leagues?.length > 0,
                hasAdminLeagues: completeUserData?.administeredLeagues?.length > 0
              });
            } else {
              console.error('[CALLBACK] Failed to fetch complete user data:', res.status);
            }
          } catch (e) {
            console.error('[CALLBACK] Network error fetching complete user data:', e);
          }
        }

        // 6. Normalize and save complete user data (same structure as normal login)
        if (completeUserData) {
          const u = completeUserData;
          
          // Normalize user object
          const normalizedUser = {
            id: u.id || '',
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            email: u.email || null,
            age: u.age || null,
            gender: u.gender || null,
            position: u.position || 'Goalkeeper (GK)',
            positionType: u.positionType || 'Goalkeeper',
            style: u.style || 'Axe',
            preferredFoot: u.preferredFoot || 'Right',
            shirtNumber: u.shirtNumber || '1',
            profilePicture: u.profilePicture || null,
            skills: u.skills || {
              dribbling: 50,
              shooting: 50,
              passing: 50,
              pace: 50,
              defending: 50,
              physical: 50
            },
            xp: u.xp || 0,
            joinedLeagues: u.leagues || [],
            managedLeagues: u.administeredLeagues || [],
            homeTeamMatches: u.homeTeamMatches || [],
            awayTeamMatches: u.awayTeamMatches || [],
            availableMatches: u.availableMatches || []
          };

          // Create userData object (same as normal login)
          const userData = {
            joinedLeagues: normalizedUser.joinedLeagues,
            managedLeagues: normalizedUser.managedLeagues,
            homeTeamMatches: normalizedUser.homeTeamMatches,
            awayTeamMatches: normalizedUser.awayTeamMatches,
            availableMatches: normalizedUser.availableMatches,
            guestMatch: null
          };

          // 7. Save to localStorage (exactly same keys as normal login)
          try {
            localStorage.setItem('user', JSON.stringify(normalizedUser));
            localStorage.setItem('userData', JSON.stringify(userData));
            console.log('[CALLBACK] ✓ Complete user data saved to localStorage');
            
            // Verify what was saved
            console.log('[CALLBACK] Final verification:');
            console.log('- user data length:', localStorage.getItem('user')?.length || 0);
            console.log('- userData length:', localStorage.getItem('userData')?.length || 0);
            console.log('- user has leagues:', normalizedUser.joinedLeagues.length > 0);
            console.log('- user has admin leagues:', normalizedUser.managedLeagues.length > 0);
          } catch (e) {
            console.error('[CALLBACK] localStorage save failed:', e);
          }
        } else {
          console.warn('[CALLBACK] No complete user data received - saving minimal data');
          
          // Fallback: save minimal user data
          const minimalUser = {
            id: '',
            firstName: '',
            lastName: '',
            email: null,
            joinedLeagues: [],
            managedLeagues: [],
            homeTeamMatches: [],
            awayTeamMatches: [],
            availableMatches: []
          };
          
          const minimalUserData = {
            joinedLeagues: [],
            managedLeagues: [],
            homeTeamMatches: [],
            awayTeamMatches: [],
            availableMatches: [],
            guestMatch: null
          };
          
          localStorage.setItem('user', JSON.stringify(minimalUser));
          localStorage.setItem('userData', JSON.stringify(minimalUserData));
        }

        // 8. Navigate to destination
        console.log('[CALLBACK] ✓ Redirecting to:', next);
        router.replace(next);
        
      } catch (error) {
        console.error('[CALLBACK] Fatal callback error:', error);
        router.replace('/');
      }
    })();
  }, [router, searchParams]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <div style={{ marginBottom: '20px', fontSize: '18px' }}>{msg}</div>
      <div style={{ fontSize: '14px', color: '#666' }}>
        Setting up your session...
      </div>
    </div>
  );
}

export default function CallbackClient() {
  return (
    <div>
      <CallbackHandler />
    </div>
  );
}