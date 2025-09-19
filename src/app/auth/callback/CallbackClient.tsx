'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeJwt } from '@/lib/auth';
<<<<<<< HEAD
import { 
  NormalizedUser, 
  UserData, 
  Skills, 
  isLeagueArray, 
  isMatchArray 
} from '@/types/shared';
=======
>>>>>>> parent of 06aa9e0 (*)

const API = process.env.NEXT_PUBLIC_API_URL;

// Type for API response payload
interface AuthDataResponse {
  user?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    age?: number;
    gender?: string;
    position?: string;
    positionType?: string;
    style?: string;
    preferredFoot?: string;
    shirtNumber?: string | number;
    profilePicture?: string;
    skills?: Skills;
    joinedLeagues?: unknown[];
    managedLeagues?: unknown[];
    administeredLeagues?: unknown[];
    leagues?: unknown[];
    homeTeamMatches?: unknown[];
    awayTeamMatches?: unknown[];
    availableMatches?: unknown[];
  };
  success?: boolean;
  message?: string;
}

// Type for raw user data from API
interface RawUserData {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  age?: number;
  gender?: string;
  position?: string;
  positionType?: string;
  style?: string;
  preferredFoot?: string;
  shirtNumber?: string | number;
  profilePicture?: string;
  skills?: Skills | Record<string, unknown>;
  joinedLeagues?: unknown[];
  managedLeagues?: unknown[];
  administeredLeagues?: unknown[];
  leagues?: unknown[];
  homeTeamMatches?: unknown[];
  awayTeamMatches?: unknown[];
  availableMatches?: unknown[];
}

function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

function isValidSkills(obj: unknown): obj is Skills {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof (obj as Skills).dribbling === 'number' &&
    typeof (obj as Skills).shooting === 'number' &&
    typeof (obj as Skills).passing === 'number' &&
    typeof (obj as Skills).pace === 'number' &&
    typeof (obj as Skills).defending === 'number' &&
    typeof (obj as Skills).physical === 'number'
  );
}

function safeParseJson<T>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

// Separate component that uses useSearchParams and is wrapped in Suspense
function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState('Signing you in…');

  useEffect(() => {
    (async () => {
      try {
        console.log('[CALLBACK] Starting callback process');
        console.log('[CALLBACK] API URL:', API);
        
        const tokenFromUrl = searchParams?.get('token') || null;
        const error = searchParams?.get('error') || null;
        const next = searchParams?.get('next') || '/home';

        console.log('[CALLBACK] URL params:', { 
          hasToken: !!tokenFromUrl, 
          tokenPreview: tokenFromUrl?.substring(0, 50) + '...', 
          error, 
          next 
        });
        console.log('[CALLBACK] Current URL:', window.location.href);

        if (error) {
<<<<<<< HEAD
          console.error('[CALLBACK] Auth error:', error);
          router.replace('/?error=' + encodeURIComponent(error));
=======
          console.error('[CALLBACK] Auth error from URL:', error);
          router.replace('/?error=' + error);
>>>>>>> parent of 06aa9e0 (*)
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

<<<<<<< HEAD
        // Set cookies and localStorage
        console.log('[CALLBACK] Setting cookies and localStorage...');
        
        // 1. Set cookies first
        const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
=======
        // Set client cookies
        const secure = window.location.protocol === 'https:';
>>>>>>> parent of 06aa9e0 (*)
        const attrs = `; Path=/; SameSite=Lax; Max-Age=604800${secure ? '; Secure' : ''}`;
        document.cookie = `token=${token}${attrs}`;
        document.cookie = `auth_token=${token}${attrs}`;
        console.log('[CALLBACK] Client cookies set');

        setMsg('Loading your profile…');

<<<<<<< HEAD
        // 3. Fetch user data
        let userFromApi: RawUserData | null = null;
=======
        // Fetch user data from API
        let userFromApi: any = null;
>>>>>>> parent of 06aa9e0 (*)
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
              const payload = safeParseJson<AuthDataResponse>(await res.text());
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

<<<<<<< HEAD
        // 4. Normalize user data with proper defaults for social login
        const u = userFromApi || {};
        
        // Validate and normalize skills
        const defaultSkills: Skills = {
          dribbling: 50,
          shooting: 50,
          passing: 50,
          pace: 50,
          defending: 50,
          physical: 50
        };
        
        const skills = isValidSkills(u.skills) ? u.skills : defaultSkills;
        
        // Validate and normalize arrays
        const joinedLeagues = isLeagueArray(u.joinedLeagues) ? u.joinedLeagues : 
                             isLeagueArray(u.leagues) ? u.leagues : [];
        const managedLeagues = isLeagueArray(u.managedLeagues) ? u.managedLeagues : 
                              isLeagueArray(u.administeredLeagues) ? u.administeredLeagues : [];
        const homeTeamMatches = isMatchArray(u.homeTeamMatches) ? u.homeTeamMatches : [];
        const awayTeamMatches = isMatchArray(u.awayTeamMatches) ? u.awayTeamMatches : [];
        const availableMatches = isMatchArray(u.availableMatches) ? u.availableMatches : [];

        const normalizedUser: NormalizedUser = {
=======
        // Normalize user data
        const u = (userFromApi || {}) as Record<string, any>;
        const normalizedUser = {
>>>>>>> parent of 06aa9e0 (*)
          id: u.id || '',
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          email: typeof u.email === 'string' ? u.email : null,
          age: typeof u.age === 'number' ? u.age : null,
          gender: typeof u.gender === 'string' ? u.gender : null,
<<<<<<< HEAD
          position: u.position || 'Goalkeeper (GK)',
          positionType: u.positionType || 'Goalkeeper',
          style: u.style || 'Axe',
          preferredFoot: u.preferredFoot || 'Right',
          shirtNumber: String(u.shirtNumber || '1'),
          profilePicture: typeof u.profilePicture === 'string' ? u.profilePicture : null,
          skills,
          joinedLeagues,
          managedLeagues,
          homeTeamMatches,
          awayTeamMatches,
          availableMatches,
=======
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
>>>>>>> parent of 06aa9e0 (*)
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
  }, [router, searchParams]);

  return (
    <div style={{ padding: 16 }}>
      <p>{msg}</p>
      <p style={{ fontSize: 12, color: '#666' }}>
        Check browser console for debug logs...
      </p>
    </div>
  );
}

export default function CallbackClient() {
  return <CallbackHandler />;
}