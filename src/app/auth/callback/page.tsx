'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeJwt, saveAuthSession } from '@/lib/auth';
import type { NormalizedUser, UserData } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL;

function normalizeUser(data: UserData | null): NormalizedUser {
  const d = (data ?? {}) as Record<string, unknown>;

  const str = (k: string, fallback = ''): string =>
    typeof d[k] === 'string' ? (d[k] as string) : fallback;

  const maybeStr = (k: string): string | null =>
    typeof d[k] === 'string' ? (d[k] as string) : null;

  const num = (k: string, fallback = 0): number => {
    const v = d[k];
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && !Number.isNaN(Number(v))) return Number(v);
    return fallback;
  };

  const arr = (k: string): unknown[] => (Array.isArray(d[k]) ? (d[k] as unknown[]) : []);

  const skills =
    typeof d['skills'] === 'object' && d['skills'] !== null
      ? (d['skills'] as Record<string, unknown>)
      : undefined;

  const joined = arr('leagues');
  const joinedLeagues = joined.length ? joined : arr('joinedLeagues');

  const managed = arr('administeredLeagues');
  const managedLeagues = managed.length ? managed : arr('managedLeagues');

  return {
    id: str('id'),
    firstName: str('firstName'),
    lastName: str('lastName'),
    email: maybeStr('email'),
    age: typeof d['age'] === 'number' ? (d['age'] as number) : null,
    gender: maybeStr('gender'),
    position: str('position'),
    positionType: str('positionType'),
    style: str('style'),
    preferredFoot: str('preferredFoot'),
    shirtNumber: num('shirtNumber', 1),
    profilePicture: maybeStr('profilePicture'),
    skills,
    joinedLeagues,
    managedLeagues,
    homeTeamMatches: arr('homeTeamMatches'),
    awayTeamMatches: arr('awayTeamMatches'),
    availableMatches: arr('availableMatches'),
  };
}

interface AuthDataResponse {
  user?: UserData;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState('Signing you in…');

  useEffect(() => {
    const token = sp?.get('token');
    const error = sp?.get('error');
    const next = sp?.get('next') || '/home';

    if (error || !token) {
      router.replace('/');
      return;
    }

    const { exp } = decodeJwt(token);

    const secure = window.location.protocol === 'https:';
    const attrs = `; Path=/; SameSite=Lax; Max-Age=604800${secure ? '; Secure' : ''}`;
    document.cookie = `token=${token}${attrs}`;
    document.cookie = `auth_token=${token}${attrs}`;

    (async () => {
      try {
        setMsg('Loading your profile…');
        const res = await fetch(`${API}/auth/data`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        let userData: UserData | null = null;
        if (res.ok) {
          const payload = (await res.json()) as AuthDataResponse;
          userData = payload.user ?? null;
        }

        const normalizedUser = normalizeUser(userData);

        // Save everything: token, user, userData, isAuthenticated, sessionExpiry
        saveAuthSession(token, normalizedUser, exp, userData ?? {});
      } catch {
        // Minimal session if fetch fails
        saveAuthSession(token, normalizeUser(null), exp, {});
      } finally {
        window.location.replace(next);
      }
    })();
  }, [router, sp]);

  return <p style={{ padding: 16 }}>{msg}</p>;
}