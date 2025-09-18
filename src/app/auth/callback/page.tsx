'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeJwt, saveAuthSession } from '@/lib/auth';
import type { NormalizedUser, UserData } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL;

interface AuthDataResponse {
  user?: UserData;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState('Signing you in…');

  useEffect(() => {
    const token = sp?.get('token');           // fix: sp may be null
    const error = sp?.get('error');           // fix: sp may be null
    const next = sp?.get('next') || '/home';  // fix: sp may be null

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
          userData = payload?.user ?? null;
        }

        // Normalize to the same shape as email/password login for "user"
        const u = (userData || {}) as Record<string, unknown>;
        const normalizedUser: NormalizedUser = {
          id: (u['id'] as string) || '',
          firstName: (u['firstName'] as string) || '',
          lastName: (u['lastName'] as string) || '',
          email: typeof u['email'] === 'string' ? (u['email'] as string) : null,
          age: typeof u['age'] === 'number' ? (u['age'] as number) : null,
          gender: typeof u['gender'] === 'string' ? (u['gender'] as string) : null,
          position: (u['position'] as string) || '',
          positionType: (u['positionType'] as string) || '',
          style: (u['style'] as string) || '',
          preferredFoot: (u['preferredFoot'] as string) || '',
          shirtNumber:
            typeof u['shirtNumber'] === 'number'
              ? (u['shirtNumber'] as number)
              : typeof u['shirtNumber'] === 'string' && !Number.isNaN(Number(u['shirtNumber']))
              ? Number(u['shirtNumber'])
              : 0,
          profilePicture: typeof u['profilePicture'] === 'string' ? (u['profilePicture'] as string) : null,
          skills:
            typeof u['skills'] === 'object' && u['skills'] !== null
              ? (u['skills'] as Record<string, unknown>)
              : undefined,
          joinedLeagues:
            (Array.isArray(u['leagues']) ? (u['leagues'] as unknown[]) : []).length
              ? ((u['leagues'] as unknown[]) ?? [])
              : ((u['joinedLeagues'] as unknown[]) ?? []),
          managedLeagues:
            (Array.isArray(u['administeredLeagues']) ? (u['administeredLeagues'] as unknown[]) : []).length
              ? ((u['administeredLeagues'] as unknown[]) ?? [])
              : ((u['managedLeagues'] as unknown[]) ?? []),
          homeTeamMatches: (Array.isArray(u['homeTeamMatches']) ? (u['homeTeamMatches'] as unknown[]) : []) ?? [],
          awayTeamMatches: (Array.isArray(u['awayTeamMatches']) ? (u['awayTeamMatches'] as unknown[]) : []) ?? [],
          availableMatches: (Array.isArray(u['availableMatches']) ? (u['availableMatches'] as unknown[]) : []) ?? [],
        };

        // Save everything: token, user, userData, isAuthenticated, sessionExpiry
        saveAuthSession(token, normalizedUser, exp, userData ?? {});
      } catch {
        // Minimal session if fetch fails
        saveAuthSession(token, {
          id: '',
          firstName: '',
          lastName: '',
          email: null,
          age: null,
          gender: null,
          position: '',
          positionType: '',
          style: '',
          preferredFoot: '',
          shirtNumber: 0,
          profilePicture: null,
          skills: undefined,
          joinedLeagues: [],
          managedLeagues: [],
          homeTeamMatches: [],
          awayTeamMatches: [],
          availableMatches: [],
        }, exp, {});
      } finally {
        window.location.replace(next);
      }
    })();
  }, [router, sp]);

  return <p style={{ padding: 16 }}>{msg}</p>;
}