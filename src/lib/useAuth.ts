import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { User } from '@/types/user';
import { authStorage } from './authStorage';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const cookieToken = Cookies.get('token') || null;
      // Validate token format - must be valid JWT with 3 parts
      if (cookieToken && cookieToken !== 'undefined' && cookieToken.split('.').length === 3) {
        console.log('✅ Valid token from cookie:', {
          length: cookieToken.length,
          parts: cookieToken.split('.').length
        });
        return cookieToken;
      } else if (cookieToken) {
        console.warn('❌ Invalid token detected, clearing:', cookieToken);
        Cookies.remove('token');
        return null;
      }
      return null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Fetch user info from backend using JWT
  const fetchUser = useCallback(async (jwt: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      const data = await res.json();
      if (data.success && data.user) {
        const userIdValue = data.user.id || data.user.userId || data.user.user_id || data.user._id;
        const normalized = {
          ...data.user,
          id: userIdValue,
          userId: userIdValue,
          user_id: userIdValue,
          _id: userIdValue
        };
        setUser(normalized);
      } else {
        const cachedAuth = authStorage.getAuth();
        if (cachedAuth && cachedAuth.user) {
          console.warn('[useAuth] Backend check failed, falling back to cached user');
          setUser(cachedAuth.user as User);
        } else {
          setUser(null);
          Cookies.remove('token');
        }
      }
    } catch {
      const cachedAuth = authStorage.getAuth();
      if (cachedAuth && cachedAuth.user) {
        console.warn('[useAuth] Network error, falling back to cached user');
        setUser(cachedAuth.user as User);
      } else {
        setUser(null);
        Cookies.remove('token');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount, check for token and fetch user
  // On mount, check for token and fetch user
  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  // Login: save token and user
  const login = (jwt: string, userObj: User) => {
    const userIdValue = userObj.id || (userObj as any).userId || (userObj as any).user_id || (userObj as any)._id;
    const normalized = {
      ...userObj,
      id: userIdValue,
      userId: userIdValue,
      user_id: userIdValue,
      _id: userIdValue
    };
    setToken(jwt);
    setUser(normalized);
    Cookies.set('token', jwt, { expires: 7, path: '/' });
  };

  // Logout: clear everything
  const logout = () => {
    setToken(null);
    setUser(null);
    Cookies.remove('token', { path: '/' });
  };

  return { user, token, login, logout, loading };
} 