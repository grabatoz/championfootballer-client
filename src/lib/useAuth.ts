import { useState, useEffect, useCallback } from 'react';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(() => typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const [loading, setLoading] = useState(true);

  // Fetch user info from backend using JWT
  const fetchUser = useCallback(async (jwt: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      const data = await res.json();
      if (data.success) setUser(data.user);
      else {
        setUser(null);
        localStorage.removeItem('token');
      }
    } catch {
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount, check for token and fetch user
  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  // Login: save token and user
  const login = (jwt: string, userObj: any) => {
    setToken(jwt);
    setUser(userObj);
    localStorage.setItem('token', jwt);
  };

  // Logout: clear everything
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return { user, token, login, logout, loading };
} 