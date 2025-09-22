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
        const url = new URL(window.location.href);
        const token = url.searchParams.get('token');
        const next = url.searchParams.get('next') || '/home';

        if (!token) {
          setMsg('Login failed: No token');
          setTimeout(() => (window.location.href = '/'), 800);
          return;
        }

        const decoded = decodeJwt(token) as DecodedToken | null;
        if (!decoded?.userId) {
          setMsg('Login failed: Invalid token');
          setTimeout(() => (window.location.href = '/'), 800);
          return;
        }

        // Pre-set cookies so middleware allows /auth/data if cookie-based
        document.cookie = `token=${token}; path=/; max-age=${365*24*60*60}; SameSite=Lax`;
        document.cookie = `auth_token=${token}; path=/; max-age=${365*24*60*60}; SameSite=Lax`;

        // Try to get FULL user from API using the token
        let fullUser: BackendUser | null = null;
        try {
          const res = await fetch(`${API_BASE}/auth/data`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (res.ok) {
            const json = await res.json() as AuthDataResponse;
            fullUser = json?.user || null;
          }
        } catch (e) {
          console.warn('[CALLBACK] Failed to fetch /auth/data, will fallback.', e);
        }

        // Map server user -> exact objects we store
        const user: UserProfile = fullUser 
          ? normalizeUserProfile(fullUser, decoded)
          : createFallbackUserProfile(decoded);

        const userData: UserDataShape = fullUser 
          ? normalizeUserData(fullUser)
          : createEmptyUserData();

        authStorage.saveAuthExact(user, userData, token);

        // Ensure cookie exists before redirect (middleware)
        for (let i = 0; i < 15; i++) {
          const hasCookie = document.cookie.includes('token=') || document.cookie.includes('auth_token=');
          if (hasCookie) break;
          document.cookie = `token=${token}; path=/; max-age=${365*24*60*60}; SameSite=Lax`;
          document.cookie = `auth_token=${token}; path=/; max-age=${365*24*60*60}; SameSite=Lax`;
          await sleep(100);
        }

        setMsg('Login successful! Redirecting...');
        await sleep(300);
        window.location.href = next;
      } catch (e) {
        console.error(e);
        setMsg('Login failed. Please try again.');
        setTimeout(() => (window.location.href = '/'), 800);
      }
    })();
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Authentication</h2>
        <p>{msg}</p>
      </div>
    </div>
  );
}

export default function CallbackClient() {
  return <CallbackHandler />;
}