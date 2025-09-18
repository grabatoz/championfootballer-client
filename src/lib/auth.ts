export type AuthUser = Record<string, any>;

export function decodeJwt(token: string): { exp?: number } {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return {};
  }
}

export function saveAuthSession(token: string, user: AuthUser, exp?: number, userData?: any) {
  const now = Math.floor(Date.now() / 1000);
  const expiresAtSec = exp && Number.isFinite(exp) ? exp : now + 7 * 24 * 60 * 60; // fallback 7d
  const expiresAtISO = new Date(expiresAtSec * 1000).toISOString();

  // Keys as per your screenshot
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user || {}));
  localStorage.setItem('userData', JSON.stringify(userData ?? user ?? {}));
  localStorage.setItem('isAuthenticated', String(expiresAtSec > now));
  localStorage.setItem('sessionExpiry', expiresAtISO);

  // Optional legacy keys for compatibility
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user || {}));
  localStorage.setItem('isAuthenticated', String(expiresAtSec > now));
  localStorage.setItem('expiresAt', String(expiresAtSec));
  localStorage.setItem('savedAt', String(Date.now()));

  try {
    localStorage.setItem('auth._ping', String(Date.now()));
    localStorage.removeItem('auth._ping');
  } catch {}
}

export function clearAuthSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userData');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('sessionExpiry');

  localStorage.removeItem('auth.token');
  localStorage.removeItem('auth.user');
  localStorage.removeItem('auth.isAuthenticated');
  localStorage.removeItem('auth.expiresAt');
  localStorage.removeItem('auth.savedAt');
}

export function loadAuthSession() {
  const token = localStorage.getItem('token') || localStorage.getItem('auth.token') || null;
  const userRaw = localStorage.getItem('user') ?? localStorage.getItem('auth.user') ?? null;
  const userDataRaw = localStorage.getItem('userData') ?? userRaw;

  let user: AuthUser | null = null;
  let userData: any = null;
  try { user = userRaw ? JSON.parse(userRaw) : null; } catch { user = null; }
  try { userData = userDataRaw ? JSON.parse(userDataRaw) : null; } catch { userData = null; }

  const isAuthenticated = (localStorage.getItem('isAuthenticated') ?? localStorage.getItem('auth.isAuthenticated')) === 'true';

  let expiresAt = 0;
  const sessionExpiryISO = localStorage.getItem('sessionExpiry');
  if (sessionExpiryISO) {
    const t = Date.parse(sessionExpiryISO);
    if (!Number.isNaN(t)) expiresAt = Math.floor(t / 1000);
  } else {
    const oldExp = Number(localStorage.getItem('auth.expiresAt') || 0);
    if (Number.isFinite(oldExp)) expiresAt = oldExp;
  }

  return { token, user, userData, isAuthenticated, expiresAt };
}