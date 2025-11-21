/**
 * Token Manager - Ensures token is always available for API calls
 * Auto-recovers token from localStorage if cookies are cleared
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
   * Get valid token from cookies or recover from localStorage
   */
  getToken(): string | null {
    // Try cookies first (primary source)
    let token: string | null = Cookies.get('token') || Cookies.get('auth_token') || null;
    
    // Validate token
    if (token && token !== 'undefined' && token !== 'null' && this.isValidJWT(token)) {
      return token;
    }

    // Token missing or invalid - try to recover from localStorage
    console.warn('⚠️ Token missing from cookies, attempting recovery...');
    const recoveredToken = this.recoverTokenFromStorage();
    
    if (recoveredToken) {
      console.log('✅ Token recovered and restored to cookies');
      return recoveredToken;
    }

    console.error('❌ No valid token found anywhere');
    return null;
  }

  /**
   * Validate JWT format
   */
  private isValidJWT(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * Recover token from localStorage backup
   */
  private recoverTokenFromStorage(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      // Try authData backup
      const authData = localStorage.getItem('authData');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.token && this.isValidJWT(parsed.token)) {
          // Restore to cookies
          Cookies.set('token', parsed.token, { expires: 365, path: '/', sameSite: 'lax' });
          Cookies.set('auth_token', parsed.token, { expires: 365, path: '/', sameSite: 'lax' });
          return parsed.token;
        }
      }

      // Try sessionStorage backup
      const sessionData = sessionStorage.getItem('authData');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.token && this.isValidJWT(parsed.token)) {
          // Restore to cookies
          Cookies.set('token', parsed.token, { expires: 365, path: '/', sameSite: 'lax' });
          Cookies.set('auth_token', parsed.token, { expires: 365, path: '/', sameSite: 'lax' });
          return parsed.token;
        }
      }
    } catch (error) {
      console.error('Token recovery failed:', error);
    }

    return null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  /**
   * Clear all tokens (logout)
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
    console.log('🚪 All tokens cleared');
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
