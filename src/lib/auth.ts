export interface SkillScores {
  dribbling: number;
  shooting: number;
  passing: number;
  pace: number;
  defending: number;
  physical: number;
}

export interface NormalizedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  age?: number | null;
  gender?: string | null;
  position: string;
  positionType: string;
  style: string;
  preferredFoot: string;
  shirtNumber: number;
  profilePicture?: string | null;
  skills?: SkillScores | Record<string, unknown>;
  joinedLeagues?: unknown[];
  managedLeagues?: unknown[];
  homeTeamMatches?: unknown[];
  awayTeamMatches?: unknown[];
  availableMatches?: unknown[];
}

export type UserData = Record<string, unknown>;

export interface JwtPayload {
  exp?: number;
}

export interface AuthSession {
  token: string | null;
  user: NormalizedUser | null;
  userData: UserData | null;
  isAuthenticated: boolean;
  expiresAt: number; // unix seconds
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function decodeJwt(token: string): JwtPayload {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    // escape is deprecated but fine for simple UTF-8 decode fallback
    return JSON.parse(decodeURIComponent(escape(json))) as JwtPayload;
  } catch {
    return {};
  }
}

export function saveAuthSession(
  token: string,
  user: NormalizedUser,
  exp?: number,
  userData?: UserData
): void {
  const now = Math.floor(Date.now() / 1000);
  const expiresAtSec = exp && Number.isFinite(exp) ? exp : now + 7 * 24 * 60 * 60; // fallback 7d
  const expiresAtISO = new Date(expiresAtSec * 1000).toISOString();

  // Keys as per your screenshot
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user ?? {}));
  localStorage.setItem('userData', JSON.stringify(userData ?? user ?? {}));
  localStorage.setItem('isAuthenticated', String(expiresAtSec > now));
  localStorage.setItem('sessionExpiry', expiresAtISO);

  // Optional legacy keys for compatibility
  localStorage.setItem('expiresAt', String(expiresAtSec));
  localStorage.setItem('savedAt', String(Date.now()));

  try {
    localStorage.setItem('auth._ping', String(Date.now()));
    localStorage.removeItem('auth._ping');
  } catch {
    // ignore storage event sync failures
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userData');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('sessionExpiry');

  // legacy
  localStorage.removeItem('auth.token');
  localStorage.removeItem('auth.user');
  localStorage.removeItem('auth.isAuthenticated');
  localStorage.removeItem('auth.expiresAt');
  localStorage.removeItem('auth.savedAt');
}

export function loadAuthSession(): AuthSession {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('auth.token') ||
    null;

  const userRaw =
    localStorage.getItem('user') ??
    localStorage.getItem('auth.user') ??
    null;

  const userDataRaw = localStorage.getItem('userData') ?? userRaw;

  const user = safeJsonParse<NormalizedUser>(userRaw);
  const userData = safeJsonParse<UserData>(userDataRaw);

  const isAuthenticated =
    (localStorage.getItem('isAuthenticated') ??
      localStorage.getItem('auth.isAuthenticated')) === 'true';

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