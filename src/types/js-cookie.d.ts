declare module 'js-cookie' {
  export interface CookieAttributes {
    expires?: number | Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  }

  export interface CookiesStatic {
    set(name: string, value: string | object, options?: CookieAttributes): string | undefined;
    get(name: string): string | undefined;
    get(): { [key: string]: string };
    remove(name: string, options?: CookieAttributes): void;
  }

  const Cookies: CookiesStatic;
  export default Cookies;
} 