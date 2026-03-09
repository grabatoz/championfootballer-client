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
  country?: string | null;
  state?: string | null;
  city?: string | null;
  phone?: string | null;
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
  console.log('💾 Saving auth data:', { 
    userId: user.id, 
    tokenLength: token?.length,
    tokenValid: token && token.split('.').length === 3 
  });

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

  // Cookies for middleware - CRITICAL: Must set token properly
  Cookies.set('token', token, { expires: 365, path: '/', sameSite: 'lax' });
  Cookies.set('auth_token', token, { expires: 365, path: '/', sameSite: 'lax' });
  
  // document.cookie fallback
  const maxAge = 365 * 24 * 60 * 60;
  document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;

  // Verify token was saved
  const savedToken = Cookies.get('token');
  console.log('✅ Token saved verification:', { 
    saved: !!savedToken, 
    matches: savedToken === token,
    cookieTokenLength: savedToken?.length
  });
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

      console.log('🔍 Getting auth data:', {
        isAuthenticated,
        hasUser: !!user,
        hasUserData: !!userData,
        hasToken: !!token,
        tokenLength: token?.length,
        cookiesAvailable: document.cookie.includes('token')
      });

      if (isAuthenticated === 'true' && user && userData) {
        if (!token) {
          console.error('❌ User authenticated but no token found in cookies!');
          // Try to get from localStorage backup
          const authData = localStorage.getItem('authData');
          if (authData) {
            const parsed = JSON.parse(authData) as AuthData;
            if (parsed.token) {
              console.log('✅ Recovered token from authData backup');
              // Restore to cookies
              Cookies.set('token', parsed.token, { expires: 365, path: '/' });
              return {
                token: parsed.token,
                user: JSON.parse(user) as UserProfile,
                userData: JSON.parse(userData) as UserDataShape,
                isAuthenticated: true,
                sessionExpiry: sessionExpiry || undefined,
              };
            }
          }
        }

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
        // Restore token to cookies if missing
        if (parsed.token && !Cookies.get('token')) {
          console.log('✅ Restoring token to cookies from authData');
          Cookies.set('token', parsed.token, { expires: 365, path: '/' });
        }
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
        // Restore token to cookies if missing
        if (parsed.token && !Cookies.get('token')) {
          console.log('✅ Restoring token to cookies from sessionStorage');
          Cookies.set('token', parsed.token, { expires: 365, path: '/' });
        }
        return {
          token: parsed.token,
          user: parsed.user,
          userData: parsed.userData,
          isAuthenticated: parsed.isAuthenticated,
          sessionExpiry: parsed.sessionExpiry,
        };
      }

      console.log('❌ No auth data found anywhere');
      return null;
    } catch (e) {
      console.error('[AUTH-STORAGE] getAuth error', e);
      return null;
    }
  },
};