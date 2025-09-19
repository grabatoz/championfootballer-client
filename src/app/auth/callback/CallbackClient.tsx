'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeJwt } from '@/lib/auth';
import type { NormalizedUser, UserData } from '@/lib/auth';

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
        
        const tokenFromUrl = sp?.get('token') || null;
        const error = sp?.get('error') || null;
        const next = sp?.get('next') || '/home';

        console.log('[CALLBACK] URL params:', { 
          hasToken: !!tokenFromUrl, 
          error, 
          next 
        });

        if (error) {
          console.error('[CALLBACK] Auth error:', error);
          router.replace('/?error=' + error);
          return;
        }

        const token = tokenFromUrl || getCookie('auth_token') || getCookie('token');
        
        if (!token) {
          console.error('[CALLBACK] No token found');
          router.replace('/');
          return;
        }

        console.log('[CALLBACK] Processing token...');

        // Decode exp safely
        let exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
        try {
          const d = decodeJwt(token);
          if (d?.exp && typeof d.exp === 'number') {
            exp = d.exp;
          }
        } catch (e) {
          console.warn('[CALLBACK] Token decode failed:', e);
        }

        // **PEHLE HI SET KARO DONO - COOKIES AUR LOCALSTORAGE**
        console.log('[CALLBACK] Setting cookies and localStorage...');
        
        // 1. Set cookies first
        const secure = window.location.protocol === 'https:';
        const attrs = `; Path=/; SameSite=Lax; Max-Age=604800${secure ? '; Secure' : ''}`;
        document.cookie = `token=${token}${attrs}`;
        document.cookie = `auth_token=${token}${attrs}`;
        console.log('[CALLBACK] ✓ Cookies set');

        // 2. Set localStorage authentication immediately
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('sessionExpiry', new Date(exp * 1000).toISOString());
        console.log('[CALLBACK] ✓ Basic auth state set');

        setMsg('Loading your profile…');

        // 3. Fetch user data
        let userFromApi: any = null;
        if (API) {
          try {
            const res = await fetch(`${API}/auth/data`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: 'no-store',
              mode: 'cors',
            });
            
            if (res.ok) {
              const payload = await res.json();
              userFromApi = payload?.user ?? null;
              console.log('[CALLBACK] ✓ User data fetched');
            } else {
              console.error('[CALLBACK] Failed to fetch user data:', res.status);
            }
          } catch (e) {
            console.error('[CALLBACK] Network error:', e);
          }
        }

        // 4. Normalize user data with proper defaults for social login
        const u = (userFromApi || {}) as Record<string, any>;
        const normalizedUser: NormalizedUser = {
          id: u.id || '',
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          email: typeof u.email === 'string' ? u.email : null,
          age: typeof u.age === 'number' ? u.age : null,
          gender: typeof u.gender === 'string' ? u.gender : null,
          position: u.position || 'Goalkeeper (GK)',
          positionType: u.positionType || 'Goalkeeper',
          style: u.style || 'Axe',
          preferredFoot: u.preferredFoot || 'Right',
          shirtNumber: String(u.shirtNumber || '1'), // Ensure it's always a string
          profilePicture: typeof u.profilePicture === 'string' ? u.profilePicture : null,
          skills: typeof u.skills === 'object' && u.skills !== null ? u.skills : {
            dribbling: 50,
            shooting: 50,
            passing: 50,
            pace: 50,
            defending: 50,
            physical: 50
          },
          joinedLeagues: Array.isArray(u.joinedLeagues) ? u.joinedLeagues : 
                        Array.isArray(u.leagues) ? u.leagues : [],
          managedLeagues: Array.isArray(u.managedLeagues) ? u.managedLeagues : 
                         Array.isArray(u.administeredLeagues) ? u.administeredLeagues : [],
          homeTeamMatches: Array.isArray(u.homeTeamMatches) ? u.homeTeamMatches : [],
          awayTeamMatches: Array.isArray(u.awayTeamMatches) ? u.awayTeamMatches : [],
          availableMatches: Array.isArray(u.availableMatches) ? u.availableMatches : [],
        };

        const userData: UserData = {
          joinedLeagues: normalizedUser.joinedLeagues,
          managedLeagues: normalizedUser.managedLeagues,
          homeTeamMatches: normalizedUser.homeTeamMatches,
          awayTeamMatches: normalizedUser.awayTeamMatches,
          availableMatches: normalizedUser.availableMatches,
          guestMatch: null,
        };

        // 5. Save complete user data to localStorage
        try {
          localStorage.setItem('user', JSON.stringify(normalizedUser));
          localStorage.setItem('userData', JSON.stringify(userData));
          console.log('[CALLBACK] ✓ Complete user data saved');
          
          // Verify everything is set
          console.log('[CALLBACK] Final verification:');
          console.log('- Cookies set:', !!(getCookie('token') || getCookie('auth_token')));
          console.log('- localStorage user:', !!localStorage.getItem('user'));
          console.log('- localStorage userData:', !!localStorage.getItem('userData'));
          console.log('- isAuthenticated:', localStorage.getItem('isAuthenticated'));
          
        } catch (e) {
          console.error('[CALLBACK] localStorage save failed:', e);
        }

        // 6. Navigate immediately
        console.log('[CALLBACK] ✓ Redirecting to:', next);
        router.replace(next);

      } catch (error) {
        console.error('[CALLBACK] Fatal error:', error);
        router.replace('/');
      }
    })();
  }, [router, sp]);

  return (
    <div style={{ padding: 16 }}>
      <p>{msg}</p>
      <p style={{ fontSize: 12, color: '#666' }}>
        Setting up your session...
      </p>
    </div>
  );
}