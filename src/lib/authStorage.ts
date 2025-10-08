'use client';

import Cookies from 'js-cookie';

// Define proper interfaces for League, Match, etc.
interface League {
  id: string;
  name: string;
  // Add other league properties as needed
}

interface Match {
  id: string;
  homeTeamGoals: number;
  awayTeamGoals: number;
  status: 'RESULT_PUBLISHED' | 'SCHEDULED' | 'ONGOING';
  // Add other match properties as needed
}

interface UserSkills {
  dribbling?: number;
  shooting?: number;
  passing?: number;
  pace?: number;
  defending?: number;
  physical?: number;
}

export interface BasicUser { 
  id: string; 
  email?: string; 
  joinedLeagues?: League[];
}

export interface UserProfile {
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
  profilePicture?: string | null;
  image?: string | null; // alias
  skills?: UserSkills;
  xp?: number;
}

export interface UserDataShape {
  joinedLeagues: League[];
  managedLeagues: League[];
  homeTeamMatches: Match[];
  awayTeamMatches: Match[];
  availableMatches?: Match[];
  guestMatch?: Match | null;
}

interface AuthData {
  token: string;
  user: UserProfile;
  userData: UserDataShape;
  isAuthenticated: boolean;
  sessionExpiry: string;
  timestamp: number;
}

interface AuthResult {
  token?: string;
  user: UserProfile;
  userData: UserDataShape;
  isAuthenticated: boolean;
  sessionExpiry?: string;
}

const hasWindow = (): boolean => typeof window !== 'undefined';

function persistAll(user: UserProfile, userData: UserDataShape, token: string): void {
  // Exact keys you want in LS
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('userData', JSON.stringify(userData));

  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  localStorage.setItem('sessionExpiry', expiryDate.toISOString());

  // Backup bundle
  const authData: AuthData = {
    token,
    user,
    userData,
    isAuthenticated: true,
    sessionExpiry: expiryDate.toISOString(),
    timestamp: Date.now(),
  };
  const serialized = JSON.stringify(authData);
  localStorage.setItem('authData', serialized);
  sessionStorage.setItem('authData', serialized);

  // Cookies for middleware
  Cookies.set('token', token, { expires: 365, path: '/', sameSite: 'lax' });
  Cookies.set('auth_token', token, { expires: 365, path: '/', sameSite: 'lax' });
  
  // document.cookie fallback
  const maxAge = 365 * 24 * 60 * 60;
  document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export const authStorage = {
  saveAuthExact(user: UserProfile, userData: UserDataShape, token: string): boolean {
    if (!hasWindow()) return false;
    try {
      persistAll(user, userData, token);
      return true;
    } catch (e) {
      console.error('[AUTH-STORAGE] saveAuthExact error', e);
      return false;
    }
  },

  getAuth(): AuthResult | null {
    if (!hasWindow()) return null;
    try {
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      const user = localStorage.getItem('user');
      const userData = localStorage.getItem('userData');
      const sessionExpiry = localStorage.getItem('sessionExpiry');
      const token = Cookies.get('token') || Cookies.get('auth_token');

      if (isAuthenticated === 'true' && user && userData) {
        return {
          token,
          user: JSON.parse(user) as UserProfile,
          userData: JSON.parse(userData) as UserDataShape,
          isAuthenticated: true,
          sessionExpiry: sessionExpiry || undefined,
        };
      }

      const local = localStorage.getItem('authData');
      if (local) {
        const parsed = JSON.parse(local) as AuthData;
        return {
          token: parsed.token,
          user: parsed.user,
          userData: parsed.userData,
          isAuthenticated: parsed.isAuthenticated,
          sessionExpiry: parsed.sessionExpiry,
        };
      }

      const session = sessionStorage.getItem('authData');
      if (session) {
        const parsed = JSON.parse(session) as AuthData;
        return {
          token: parsed.token,
          user: parsed.user,
          userData: parsed.userData,
          isAuthenticated: parsed.isAuthenticated,
          sessionExpiry: parsed.sessionExpiry,
        };
      }

      return null;
    } catch (e) {
      console.error('[AUTH-STORAGE] getAuth error', e);
      return null;
    }
  },
};