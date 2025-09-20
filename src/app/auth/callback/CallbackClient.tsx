'use client';

import { useEffect, useState } from 'react';
import { decodeJwt } from '@/lib/auth';
import { authStorage } from '@/lib/authStorage';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

        // Pre-set cookies so middleware allows /auth/data if cookie-based
        document.cookie = `token=${token}; path=/; max-age=${365*24*60*60}; SameSite=Lax`;
        document.cookie = `auth_token=${token}; path=/; max-age=${365*24*60*60}; SameSite=Lax`;

        // Try to get FULL user from API using the token (matches your server shape)
        let fullUser: any | null = null;
        try {
          const res = await fetch(`${API_BASE}/auth/data`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (res.ok) {
            const json = await res.json();
            fullUser = json?.user || null;
          }
        } catch (e) {
          console.warn('[CALLBACK] Failed to fetch /auth/data, will fallback.', e);
        }

        // Map server user -> exact objects we store
        const user = fullUser ? {
          id: fullUser.id,
          firstName: fullUser.firstName || '',
          lastName: fullUser.lastName || '',
          email: fullUser.email || decoded.email || '',
          age: fullUser.age,
          gender: fullUser.gender,
          position: fullUser.position,
          positionType: fullUser.positionType,
          style: fullUser.style,
          preferredFoot: fullUser.preferredFoot,
          shirtNumber: fullUser.shirtNumber,
          profilePicture: fullUser.profilePicture,
          image: fullUser.profilePicture || null,
          skills: fullUser.skills,
        } : {
          id: decoded.userId,
          firstName: decoded.firstName || '',
          lastName: decoded.lastName || '',
          email: decoded.email || '',
          image: decoded.picture || null,
        };

        const userData = fullUser ? {
          joinedLeagues: fullUser.leagues || [],
          managedLeagues: fullUser.administeredLeagues || fullUser.adminLeagues || [],
          homeTeamMatches: fullUser.homeTeamMatches || [],
          awayTeamMatches: fullUser.awayTeamMatches || [],
          availableMatches: fullUser.availableMatches || [],
        } : {
          joinedLeagues: [],
          managedLeagues: [],
          homeTeamMatches: [],
          awayTeamMatches: [],
          availableMatches: [],
        };

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