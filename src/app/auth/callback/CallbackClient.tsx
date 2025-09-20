'use client';

import { useEffect, useState } from 'react';
import { decodeJwt } from '@/lib/auth';
import { authStorage } from '@/lib/authStorage';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

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

        const decoded = decodeJwt(token);
        if (!decoded?.userId) {
          setMsg('Login failed: Invalid token');
          setTimeout(() => (window.location.href = '/'), 800);
          return;
        }

        const user = {
          id: decoded.userId,
          firstName: decoded.firstName || '',
          lastName: decoded.lastName || '',
          email: decoded.email || '',
          image: decoded.picture || null,
        };

        const userData = {
          joinedLeagues: [],
          managedLeagues: [],
          homeTeamMatches: [],
          awayTeamMatches: [],
        };

        authStorage.saveAuthExact(user, userData, token);

        // Ensure cookie is present before navigation (middleware depends on it)
        for (let i = 0; i < 20; i++) {
          const hasCookie =
            document.cookie.includes('token=') ||
            document.cookie.includes('auth_token=');
          if (hasCookie) break;
          // re-assert cookies
          document.cookie = `token=${token}; path=/; max-age=${365*24*60*60}; SameSite=Lax`;
          document.cookie = `auth_token=${token}; path=/; max-age=${365*24*60*60}; SameSite=Lax`;
          await sleep(100);
        }

        // small pause to let browser flush storage/cookies
        await sleep(200);
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