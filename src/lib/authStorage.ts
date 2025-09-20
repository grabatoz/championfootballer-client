'use client';

import Cookies from 'js-cookie';

export type BasicUser = { id: string; email?: string; joinedLeagues?: any[] };

export type UserProfile = {
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
  skills?: any;
};

export type UserDataShape = {
  joinedLeagues: any[];
  managedLeagues: any[];
  homeTeamMatches: any[];
  awayTeamMatches: any[];
  availableMatches?: any[];
  [k: string]: any;
};

const hasWindow = () => typeof window !== 'undefined';

function normalizeUserData(input?: Partial<UserDataShape>): UserDataShape {
  return {
    joinedLeagues: input?.joinedLeagues ?? [],
    managedLeagues: input?.managedLeagues ?? [],
    homeTeamMatches: input?.homeTeamMatches ?? [],
    awayTeamMatches: input?.awayTeamMatches ?? [],
    ...input,
  };
}

function persistAll(user: UserProfile, userData: UserDataShape, token: string) {
  // Exact keys you want in LS
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('userData', JSON.stringify(userData));

  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  localStorage.setItem('sessionExpiry', expiryDate.toISOString());

  // Backup bundle
  const authData = {
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
  saveAuthExact(user: UserProfile, userData: UserDataShape, token: string) {
    if (!hasWindow()) return false;
    try {
      persistAll(user, userData, token);
      return true;
    } catch (e) {
      console.error('[AUTH-STORAGE] saveAuthExact error', e);
      return false;
    }
  },
  getAuth() {
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
          user: JSON.parse(user),
          userData: JSON.parse(userData),
          isAuthenticated: true,
          sessionExpiry,
        };
      }
      const local = localStorage.getItem('authData');
      if (local) return JSON.parse(local);
      const session = sessionStorage.getItem('authData');
      if (session) return JSON.parse(session);
      return null;
    } catch (e) {
      console.error('[AUTH-STORAGE] getAuth error', e);
      return null;
    }
  },
};