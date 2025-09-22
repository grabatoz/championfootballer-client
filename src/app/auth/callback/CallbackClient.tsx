'use client';

import { useEffect, useState } from 'react';
import { decodeJwt } from '@/lib/auth';
import { authStorage, type UserProfile, type UserDataShape } from '@/lib/authStorage';

// Define interfaces for API responses
interface DecodedToken {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
}

interface BackendUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  age?: number;
  gender?: string;
  position?: string;
  positionType?: string;
  style?: string;
  preferredFoot?: string;
  shirtNumber?: number;
  profilePicture?: string;
  skills?: {
    dribbling?: number;
    shooting?: number;
    passing?: number;
    pace?: number;
    defending?: number;
    physical?: number;
  };
  leagues?: Array<{ id: string; name: string }>;
  administeredLeagues?: Array<{ id: string; name: string }>;
  adminLeagues?: Array<{ id: string; name: string }>;
  homeTeamMatches?: Array<{
    id: string;
    homeTeamGoals?: number;
    awayTeamGoals?: number;
    status?: string;
  }>;
  awayTeamMatches?: Array<{
    id: string;
    homeTeamGoals?: number;
    awayTeamGoals?: number;
    status?: string;
  }>;
  availableMatches?: Array<{
    id: string;
    homeTeamGoals?: number;
    awayTeamGoals?: number;
    status?: string;
  }>;
}

interface AuthDataResponse {
  user?: BackendUser;
  success?: boolean;
  message?: string;
}

function sleep(ms: number): Promise<void> { 
  return new Promise(r => setTimeout(r, ms)); 
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function to normalize backend user data to UserDataShape
const normalizeUserData = (fullUser: BackendUser): UserDataShape => {
  return {
    joinedLeagues: (fullUser.leagues || []).map(league => ({
      id: String(league.id || ''),
      name: league.name || '',
    })),
    managedLeagues: (fullUser.administeredLeagues || fullUser.adminLeagues || []).map(league => ({
      id: String(league.id || ''),
      name: league.name || '',
    })),
    homeTeamMatches: (fullUser.homeTeamMatches || []).map(match => ({
      id: String(match.id || ''),
      homeTeamGoals: Number(match.homeTeamGoals || 0),
      awayTeamGoals: Number(match.awayTeamGoals || 0),
      status: (match.status as 'completed' | 'scheduled' | 'ongoing') || 'scheduled',
    })),
    awayTeamMatches: (fullUser.awayTeamMatches || []).map(match => ({
      id: String(match.id || ''),
      homeTeamGoals: Number(match.homeTeamGoals || 0),
      awayTeamGoals: Number(match.awayTeamGoals || 0),
      status: (match.status as 'completed' | 'scheduled' | 'ongoing') || 'scheduled',
    })),
    availableMatches: (fullUser.availableMatches || []).map(match => ({
      id: String(match.id || ''),
      homeTeamGoals: Number(match.homeTeamGoals || 0),
      awayTeamGoals: Number(match.awayTeamGoals || 0),
      status: (match.status as 'completed' | 'scheduled' | 'ongoing') || 'scheduled',
    })),
    guestMatch: null,
  };
};

// Helper function to normalize backend user to UserProfile
const normalizeUserProfile = (fullUser: BackendUser, decoded: DecodedToken): UserProfile => {
  return {
    id: fullUser.id,
    firstName: fullUser.firstName || decoded.firstName || '',
    lastName: fullUser.lastName || decoded.lastName || '',
    email: fullUser.email || decoded.email || '',
    age: typeof fullUser.age === 'string' ? Number(fullUser.age) || undefined : fullUser.age,
    gender: fullUser.gender,
    position: fullUser.position,
    positionType: fullUser.positionType,
    style: fullUser.style,
    preferredFoot: fullUser.preferredFoot,
    shirtNumber: typeof fullUser.shirtNumber === 'string' ? Number(fullUser.shirtNumber) || undefined : fullUser.shirtNumber,
    profilePicture: fullUser.profilePicture || null,
    image: fullUser.profilePicture || null,
    skills: fullUser.skills,
  };
};

// Helper function to create fallback user profile from decoded token
const createFallbackUserProfile = (decoded: DecodedToken): UserProfile => {
  return {
    id: decoded.userId,
    firstName: decoded.firstName || '',
    lastName: decoded.lastName || '',
    email: decoded.email || '',
    profilePicture: null,
    image: decoded.picture || null,
  };
};

// Helper function to create empty user data
const createEmptyUserData = (): UserDataShape => {
  return {
    joinedLeagues: [],
    managedLeagues: [],
    homeTeamMatches: [],
    awayTeamMatches: [],
    availableMatches: [],
    guestMatch: null,
  };
};

function CallbackHandler() {
  const [msg, setMsg] = useState('Processing login...');

  useEffect(() => {
    (async () => {
      try {
        console.log('[CALLBACK] Starting OAuth callback process');
        console.log('[CALLBACK] Current URL:', window.location.href);
        console.log('[CALLBACK] API Base:', API_BASE);
        
        const url = new URL(window.location.href);
        const token = url.searchParams.get('token');
        const error = url.searchParams.get('error');
        const next = url.searchParams.get('next') || '/home';

        if (error) {
          console.error('[CALLBACK] OAuth error:', error);
          setMsg(`Login failed: ${error}`);
          setTimeout(() => (window.location.href = '/'), 2000);
          return;
        }

        if (!token) {
          console.error('[CALLBACK] No token found in URL');
          setMsg('Login failed: No authentication token received');
          setTimeout(() => (window.location.href = '/'), 2000);
          return;
        }

        console.log('[CALLBACK] Token received, decoding...');
        const decoded = decodeJwt(token) as DecodedToken | null;
        if (!decoded?.userId) {
          console.error('[CALLBACK] Invalid token:', decoded);
          setMsg('Login failed: Invalid authentication token');
          setTimeout(() => (window.location.href = '/'), 2000);
          return;
        }

        console.log('[CALLBACK] Token decoded successfully, user ID:', decoded.userId);

        // Set cookies immediately
        document.cookie = `token=${token}; path=/; max-age=${365*24*60*60}; SameSite=Lax; Secure`;
        document.cookie = `auth_token=${token}; path=/; max-age=${365*24*60*60}; SameSite=Lax; Secure`;

        setMsg('Getting user data...');

        // Try to get user data from API
        let fullUser: BackendUser | null = null;
        try {
          console.log('[CALLBACK] Fetching user data from:', `${API_BASE}/auth/data`);
          const res = await fetch(`${API_BASE}/auth/data`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          console.log('[CALLBACK] API response status:', res.status);
          
          if (res.ok) {
            const json = await res.json() as AuthDataResponse;
            fullUser = json?.user || null;
            console.log('[CALLBACK] User data received:', fullUser ? 'Success' : 'No user data');
          } else {
            console.warn('[CALLBACK] API request failed with status:', res.status);
            const errorText = await res.text();
            console.warn('[CALLBACK] Error response:', errorText);
          }
        } catch (e) {
          console.warn('[CALLBACK] Failed to fetch user data, using fallback:', e);
        }

        // Process user data
        const user: UserProfile = fullUser 
          ? normalizeUserProfile(fullUser, decoded)
          : createFallbackUserProfile(decoded);

        const userData: UserDataShape = fullUser 
          ? normalizeUserData(fullUser)
          : createEmptyUserData();

        console.log('[CALLBACK] Saving auth data to storage...');
        authStorage.saveAuthExact(user, userData, token);

        // Verify cookies are set
        let cookieAttempts = 0;
        while (cookieAttempts < 5) {
          const hasCookie = document.cookie.includes('token=') || document.cookie.includes('auth_token=');
          if (hasCookie) break;
          
          document.cookie = `token=${token}; path=/; max-age=${365*24*60*60}; SameSite=Lax; Secure`;
          document.cookie = `auth_token=${token}; path=/; max-age=${365*24*60*60}; SameSite=Lax; Secure`;
          await sleep(100);
          cookieAttempts++;
        }

        console.log('[CALLBACK] Auth setup complete, redirecting to:', next);
        setMsg('Login successful! Redirecting...');
        await sleep(500);
        window.location.href = next;

      } catch (e) {
        console.error('[CALLBACK] Unexpected error:', e);
        setMsg('Login failed. Please try again.');
        setTimeout(() => (window.location.href = '/'), 2000);
      }
    })();
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Authentication</h2>
        <p>{msg}</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

export default function CallbackClient() {
  return <CallbackHandler />;
}