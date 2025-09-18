'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeJwt, saveAuthSession } from '@/lib/auth';
import type { UserData } from '@/lib/auth'; // add this import

const API = process.env.NEXT_PUBLIC_API_URL;

interface AuthDataResponse {
  user?: UserData;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState('Signing you in…');

  useEffect(() => {
    const token = sp.get('token');
    const error = sp.get('error');
    const next = sp.get('next') || '/home';

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

        let userData: UserData | null = null;               // was: any
        if (res.ok) {
          const payload = (await res.json()) as AuthDataResponse; // typed payload
          userData = payload?.user ?? null;
        }

        // Normalize to the same shape as email/password login for "user"
        const u = (userData || {}) as Record<string, unknown>;
        const normalizedUser = {
          id: u['id'] as string,
          firstName: u['firstName'] as string,
          lastName: u['lastName'] as string,
          email: (u['email'] as string) ?? null,
          age: (u['age'] as number) ?? null,
          gender: (u['gender'] as string) ?? null,
          position: u['position'] as string,
          positionType: u['positionType'] as string,
          style: u['style'] as string,
          preferredFoot: u['preferredFoot'] as string,
          shirtNumber: (u['shirtNumber'] as number) ?? 0,
          profilePicture: (u['profilePicture'] as string) ?? null,
          skills: (u['skills'] as Record<string, unknown>) ?? undefined,
          joinedLeagues: ((u['leagues'] as unknown[]) ?? (u['joinedLeagues'] as unknown[]) ?? []) as unknown[],
          managedLeagues: ((u['administeredLeagues'] as unknown[]) ?? (u['managedLeagues'] as unknown[]) ?? []) as unknown[],
          homeTeamMatches: (u['homeTeamMatches'] as unknown[]) ?? [],
          awayTeamMatches: (u['awayTeamMatches'] as unknown[]) ?? [],
          availableMatches: (u['availableMatches'] as unknown[]) ?? [],
        };

        // Save everything: token, user, userData, isAuthenticated, sessionExpiry
        saveAuthSession(token, normalizedUser as unknown as Record<string, unknown>, exp, userData);
      } catch {
        // Minimal session if fetch fails
        saveAuthSession(token, {} as Record<string, unknown>, exp, {});
      } finally {
        window.location.replace(next);
      }
    })();
  }, [router, sp]);

  return <p style={{ padding: 16 }}>{msg}</p>;
}