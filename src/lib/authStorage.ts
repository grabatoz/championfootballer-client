'use client';

import Cookies from 'js-cookie';

export type BasicUser = { id: string; email?: string; joinedLeagues?: any[] };

export type UserProfile = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  image?: string | null;
};

export type UserDataShape = {
  joinedLeagues: any[];
  managedLeagues: any[];
  homeTeamMatches: any[];
  awayTeamMatches: any[];
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
  // Exact keys
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('userData', JSON.stringify(userData));

  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  localStorage.setItem('sessionExpiry', expiryDate.toISOString());

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

  // Write BOTH cookies via js-cookie
  Cookies.set('token', token, { expires: 365, path: '/', sameSite: 'lax' });
  Cookies.set('auth_token', token, { expires: 365, path: '/', sameSite: 'lax' });

  // Fallback: also via document.cookie (some browsers/extensions)
  const maxAge = 365 * 24 * 60 * 60;
  document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;

  // Sticky flag
  localStorage.setItem('auth_bootstrapped', '1');
}

export const authStorage = {
  saveAuthExact(user: UserProfile, userDataInput: Partial<UserDataShape>, token: string) {
    if (!hasWindow()) return false;
    try {
      const userData = normalizeUserData(userDataInput);
      persistAll(user, userData, token);
      return true;
    } catch (e) {
      console.error('[AUTH-STORAGE] saveAuthExact error', e);
      return false;
    }
  },

  saveAuth(userData: BasicUser, userId: string, token: string) {
    if (!hasWindow()) return false;
    try {
      const user: UserProfile = {
        id: userId,
        email: userData.email,
      };
      const shaped = normalizeUserData({
        joinedLeagues: userData.joinedLeagues ?? [],
      });
      persistAll(user, shaped, token);
      return true;
    } catch (e) {
      console.error('[AUTH-STORAGE] saveAuth error', e);
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

  clearAuth() {
    if (!hasWindow()) return false;
    try {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      localStorage.removeItem('userData');
      localStorage.removeItem('sessionExpiry');
      localStorage.removeItem('authData');
      sessionStorage.removeItem('authData');
      Cookies.remove('token');
      Cookies.remove('auth_token');
      return true;
    } catch (e) {
      console.error('[AUTH-STORAGE] clearAuth error', e);
      return false;
    }
  },

  isAuthenticated() {
    if (!hasWindow()) return false;
    return localStorage.getItem('isAuthenticated') === 'true';
  },
};