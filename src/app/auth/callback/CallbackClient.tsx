'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeJwt } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState('Signing you in…');

  useEffect(() => {
    (async () => {
      try {
        console.log('[CALLBACK] Starting callback process');
        console.log('[CALLBACK] API URL:', API);
        
        const tokenFromUrl = sp?.get('token') || null;
        const error = sp?.get('error') || null;
        const next = sp?.get('next') || '/home';

        console.log('[CALLBACK] URL params:', { 
          hasToken: !!tokenFromUrl, 
          tokenPreview: tokenFromUrl?.substring(0, 50) + '...', 
          error, 
          next 
        });
        console.log('[CALLBACK] Current URL:', window.location.href);

        if (error) {
          console.error('[CALLBACK] Auth error from URL:', error);
          router.replace('/?error=' + error);
          return;
        }

        const token = tokenFromUrl || getCookie('auth_token') || getCookie('token');
        
        console.log('[CALLBACK] Token sources:', {
          fromUrl: !!tokenFromUrl,
          fromCookie: !!(getCookie('auth_token') || getCookie('token')),
          finalToken: !!token
        });

        if (!token) {
          console.error('[CALLBACK] No token found anywhere');
          router.replace('/');
          return;
        }

        console.log('[CALLBACK] Using token:', token.substring(0, 50) + '...');

        // Decode exp safely
        let exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
        try {
          const d = decodeJwt(token);
          if (d?.exp && typeof d.exp === 'number') {
            exp = d.exp;
            console.log('[CALLBACK] Token expires at:', new Date(exp * 1000));
          }
        } catch (e) {
          console.warn('[CALLBACK] Token decode failed:', e);
        }

        // Set client cookies
        const secure = window.location.protocol === 'https:';
        const attrs = `; Path=/; SameSite=Lax; Max-Age=604800${secure ? '; Secure' : ''}`;
        document.cookie = `token=${token}${attrs}`;
        document.cookie = `auth_token=${token}${attrs}`;
        console.log('[CALLBACK] Client cookies set');

        setMsg('Loading your profile…');

        // Fetch user data from API
        let userFromApi: any = null;
        if (API) {
          try {
            console.log('[CALLBACK] Fetching user data from:', `${API}/auth/data`);
            const res = await fetch(`${API}/auth/data`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: 'no-store',
              mode: 'cors',
            });
            console.log('[CALLBACK] Auth data response status:', res.status);
            
            if (res.ok) {
              const payload = await res.json();
              userFromApi = payload?.user ?? null;
              console.log('[CALLBACK] User data fetched successfully:', {
                hasUser: !!userFromApi,
                userId: userFromApi?.id,
                userEmail: userFromApi?.email
              });
            } else {
              const errorText = await res.text();
              console.error('[CALLBACK] Auth data fetch failed:', res.status, errorText);
            }
          } catch (e) {
            console.error('[CALLBACK] Network error fetching user data:', e);
          }
        } else {
          console.error('[CALLBACK] No API URL configured');
        }

        // Normalize user data
        const u = (userFromApi || {}) as Record<string, any>;
        const normalizedUser = {
          id: u.id || '',
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          email: typeof u.email === 'string' ? u.email : null,
          age: typeof u.age === 'number' ? u.age : null,
          gender: typeof u.gender === 'string' ? u.gender : null,
          position: u.position || '',
          positionType: u.positionType || '',
          style: u.style || '',
          preferredFoot: u.preferredFoot || '',
          shirtNumber: typeof u.shirtNumber === 'string' ? u.shirtNumber : '',
          profilePicture: typeof u.profilePicture === 'string' ? u.profilePicture : null,
          skills: typeof u.skills === 'object' && u.skills !== null ? u.skills : {
            dribbling: 50,
            shooting: 50,
            passing: 50,
            pace: 50,
            defending: 50,
            physical: 50
          },
          joinedLeagues: Array.isArray(u.leagues) ? u.leagues : (u.joinedLeagues ?? []),
          managedLeagues: Array.isArray(u.administeredLeagues) ? u.administeredLeagues : (u.managedLeagues ?? []),
          homeTeamMatches: u.homeTeamMatches ?? [],
          awayTeamMatches: u.awayTeamMatches ?? [],
          availableMatches: u.availableMatches ?? [],
        };

        const userData = {
          joinedLeagues: normalizedUser.joinedLeagues,
          managedLeagues: normalizedUser.managedLeagues,
          homeTeamMatches: normalizedUser.homeTeamMatches,
          awayTeamMatches: normalizedUser.awayTeamMatches,
          availableMatches: normalizedUser.availableMatches,
          guestMatch: null,
        };

        console.log('[CALLBACK] Normalized user data:', {
          id: normalizedUser.id,
          email: normalizedUser.email,
          hasJoinedLeagues: normalizedUser.joinedLeagues.length > 0,
          hasManagedLeagues: normalizedUser.managedLeagues.length > 0
        });

        console.log('[CALLBACK] Writing to localStorage...');

        // Check if localStorage is available
        if (typeof Storage === 'undefined') {
          console.error('[CALLBACK] localStorage not available');
          router.replace(next);
          return;
        }

        // Force write the 4 localStorage keys
        try {
          const userJson = JSON.stringify(normalizedUser);
          const userDataJson = JSON.stringify(userData);
          const sessionExpiry = new Date(exp * 1000).toISOString();

          console.log('[CALLBACK] Writing localStorage items...');
          
          localStorage.setItem('user', userJson);
          console.log('[CALLBACK] ✓ user written');
          
          localStorage.setItem('userData', userDataJson);
          console.log('[CALLBACK] ✓ userData written');
          
          localStorage.setItem('isAuthenticated', 'true');
          console.log('[CALLBACK] ✓ isAuthenticated written');
          
          localStorage.setItem('sessionExpiry', sessionExpiry);
          console.log('[CALLBACK] ✓ sessionExpiry written');
          
          console.log('[CALLBACK] All localStorage keys written successfully');
          
          // Verify what was actually written
          console.log('[CALLBACK] Verification check:');
          console.log('- user length:', localStorage.getItem('user')?.length || 0);
          console.log('- userData length:', localStorage.getItem('userData')?.length || 0);
          console.log('- isAuthenticated:', localStorage.getItem('isAuthenticated'));
          console.log('- sessionExpiry:', localStorage.getItem('sessionExpiry'));
          
        } catch (e) {
          console.error('[CALLBACK] localStorage write failed:', e);
        }

        console.log('[CALLBACK] Redirecting to:', next);
        router.replace(next);

      } catch (error) {
        console.error('[CALLBACK] Fatal callback error:', error);
        router.replace('/');
      }
    })();
  }, [router, sp]);

  return (
    <div style={{ padding: 16 }}>
      <p>{msg}</p>
      <p style={{ fontSize: 12, color: '#666' }}>
        Check browser console for debug logs...
      </p>
    </div>
  );
}