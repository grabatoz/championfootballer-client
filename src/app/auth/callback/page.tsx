'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeJwt, saveAuthSession } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL;

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

        let userData: any = null;
        if (res.ok) {
          const payload = await res.json();
          userData = payload?.user || null;
        }

        // Normalize to the same shape as email/password login for "user"
        const u = userData || {};
        const normalizedUser = {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          age: u.age ?? null,
          gender: u.gender ?? null,
          position: u.position,
          positionType: u.positionType,
          style: u.style,
          preferredFoot: u.preferredFoot,
          shirtNumber: u.shirtNumber,
          profilePicture: u.profilePicture,
          skills: u.skills,
          joinedLeagues: u.leagues ?? u.joinedLeagues ?? [],
          managedLeagues: u.administeredLeagues ?? u.managedLeagues ?? [],
          homeTeamMatches: u.homeTeamMatches ?? [],
          awayTeamMatches: u.awayTeamMatches ?? [],
          availableMatches: u.availableMatches ?? [],
        };

        // Save everything: token, user, userData, isAuthenticated, sessionExpiry
        saveAuthSession(token, normalizedUser, exp, userData);
      } catch {
        // Minimal session if fetch fails
        saveAuthSession(token, {}, exp, {});
      } finally {
        window.location.replace(next);
      }
    })();
  }, [router, sp]);

  return <p style={{ padding: 16 }}>{msg}</p>;
}