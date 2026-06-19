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
  userId?: string;
  user_id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  age?: number;
  gender?: string;
  country?: string | null;
  phoneCountryCode?: string | null;
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
  // Standardize ID fields
  const userIdValue = user.id || (user as any).userId || (user as any).user_id || (user as any)._id;
  const standardizedUser: UserProfile = {
    ...user,
    id: userIdValue,
    userId: userIdValue,
    user_id: userIdValue,
    _id: userIdValue
  };

  console.log('💾 Saving auth data:', { 
    userId: userIdValue, 
    tokenLength: token?.length,
    tokenValid: token && token.split('.').length === 3 
  });

  // Exact keys you want in LS
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('user', JSON.stringify(standardizedUser));
  localStorage.setItem('userData', JSON.stringify(userData));
  localStorage.setItem('token', token);

  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  localStorage.setItem('sessionExpiry', expiryDate.toISOString());

  // Backup bundle
  const authData: AuthData = {
    token,
    user: standardizedUser,
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
      const cookieToken = Cookies.get('token') || Cookies.get('auth_token');
      const localToken = localStorage.getItem('token') || undefined;

      const restoreTokenCookies = (tokenToRestore: string): string => {
        Cookies.set('token', tokenToRestore, { expires: 365, path: '/', sameSite: 'lax' });
        Cookies.set('auth_token', tokenToRestore, { expires: 365, path: '/', sameSite: 'lax' });
        localStorage.setItem('token', tokenToRestore);
        return tokenToRestore;
      };

      const getTokenFromBackup = (): string | undefined => {
        if (localToken) return localToken;

        const localAuthData = localStorage.getItem('authData');
        if (localAuthData) {
          try {
            const parsed = JSON.parse(localAuthData) as Partial<AuthData>;
            if (typeof parsed.token === 'string' && parsed.token.length > 0) return parsed.token;
          } catch {
            // ignore malformed local authData
          }
        }

        const sessionAuthData = sessionStorage.getItem('authData');
        if (sessionAuthData) {
          try {
            const parsed = JSON.parse(sessionAuthData) as Partial<AuthData>;
            if (typeof parsed.token === 'string' && parsed.token.length > 0) return parsed.token;
          } catch {
            // ignore malformed session authData
          }
        }

        return undefined;
      };

      if (process.env.NODE_ENV !== 'production') {
        console.log('[AUTH-STORAGE] getAuth snapshot:', {
          isAuthenticated,
          hasUser: !!user,
          hasUserData: !!userData,
          hasCookieToken: !!cookieToken,
          hasLocalToken: !!localToken,
        });
      }

      const standardizeUserProfile = (u: UserProfile): UserProfile => {
        const uid = u.id || (u as any).userId || (u as any).user_id || (u as any)._id;
        return {
          ...u,
          id: uid,
          userId: uid,
          user_id: uid,
          _id: uid
        };
      };

      if (isAuthenticated === 'true' && user && userData) {
        let token = cookieToken;

        if (!token) {
          const recoveredToken = getTokenFromBackup();
          if (recoveredToken) {
            token = restoreTokenCookies(recoveredToken);
            if (process.env.NODE_ENV !== 'production') {
              console.warn('[AUTH-STORAGE] Token missing in cookies, recovered from backup storage.');
            }
          } else {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('[AUTH-STORAGE] Auth state exists but token is missing; returning null.');
            }
            return null;
          }
        }

        return {
          token,
          user: standardizeUserProfile(JSON.parse(user) as UserProfile),
          userData: JSON.parse(userData) as UserDataShape,
          isAuthenticated: true,
          sessionExpiry: sessionExpiry || undefined,
        };
      }

      const local = localStorage.getItem('authData');
      if (local) {
        const parsed = JSON.parse(local) as AuthData;
        if (!parsed.token) return null;
        if (!cookieToken) {
          restoreTokenCookies(parsed.token);
        }
        return {
          token: parsed.token,
          user: standardizeUserProfile(parsed.user),
          userData: parsed.userData,
          isAuthenticated: parsed.isAuthenticated,
          sessionExpiry: parsed.sessionExpiry,
        };
      }

      const session = sessionStorage.getItem('authData');
      if (session) {
        const parsed = JSON.parse(session) as AuthData;
        if (!parsed.token) return null;
        if (!cookieToken) {
          restoreTokenCookies(parsed.token);
        }
        return {
          token: parsed.token,
          user: standardizeUserProfile(parsed.user),
          userData: parsed.userData,
          isAuthenticated: parsed.isAuthenticated,
          sessionExpiry: parsed.sessionExpiry,
        };
      }

      return null;
    } catch (e) {
      console.warn('[AUTH-STORAGE] getAuth error', e);
      return null;
    }
  },
};
