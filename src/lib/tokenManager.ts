/**
 * Token Manager - Ensures token is always available for API calls
 * Auto-recovers token from localStorage/sessionStorage if cookies are cleared
 */

import Cookies from 'js-cookie';

export class TokenManager {
  private static instance: TokenManager;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Get a valid JWT from cookies first, then storage recovery.
   */
  getToken(): string | null {
    const cookieCandidates = [Cookies.get('token'), Cookies.get('auth_token')];
    for (const candidate of cookieCandidates) {
      if (candidate && this.isValidJWT(candidate)) {
        this.restoreToken(candidate);
        return candidate;
      }
    }

    const recoveredToken = this.recoverTokenFromStorage();
    if (recoveredToken) {
      this.restoreToken(recoveredToken);
      return recoveredToken;
    }

    return null;
  }

  /**
   * Validate JWT format and check expiry when exp is present.
   */
  private isValidJWT(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    if (token === 'undefined' || token === 'null') return false;

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    try {
      const payload = JSON.parse(atob(parts[1]));
      const exp = Number(payload?.exp);
      if (Number.isFinite(exp)) {
        const now = Math.floor(Date.now() / 1000);
        if (exp <= now) return false;
      }
    } catch {
      // If decode fails, still allow structurally valid JWT.
    }

    return true;
  }

  /**
   * Recover token from common storage locations.
   */
  private recoverTokenFromStorage(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const directToken =
        localStorage.getItem('token') ||
        localStorage.getItem('auth_token') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('auth_token');

      if (directToken && this.isValidJWT(directToken)) {
        return directToken;
      }

      const authData = localStorage.getItem('authData');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed?.token && this.isValidJWT(parsed.token)) {
          return parsed.token;
        }
      }

      const sessionData = sessionStorage.getItem('authData');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed?.token && this.isValidJWT(parsed.token)) {
          return parsed.token;
        }
      }
    } catch (error) {
      console.error('Token recovery failed:', error);
    }

    return null;
  }

  /**
   * Keep both cookie keys in sync.
   */
  private restoreToken(token: string): void {
    if (!token || !this.isValidJWT(token)) return;
    Cookies.set('token', token, { expires: 365, path: '/', sameSite: 'lax' });
    Cookies.set('auth_token', token, { expires: 365, path: '/', sameSite: 'lax' });
  }

  /**
   * Check if user is authenticated.
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  /**
   * Clear all tokens (logout).
   */
  clearToken(): void {
    Cookies.remove('token', { path: '/' });
    Cookies.remove('auth_token', { path: '/' });
    localStorage.removeItem('authData');
    sessionStorage.removeItem('authData');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    localStorage.removeItem('isAuthenticated');
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();

// Export helper function
export function getAuthToken(): string | null {
  return tokenManager.getToken();
}

export function isAuthenticated(): boolean {
  return tokenManager.isAuthenticated();
}
