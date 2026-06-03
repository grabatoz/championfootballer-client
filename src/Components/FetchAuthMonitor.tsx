"use client";
import { useEffect } from "react";

/**
 * FetchAuthMonitor
 * - Monkey patches window.fetch to automatically attach Authorization header if missing.
 * - Prevents early unauthenticated calls on refresh where components fire before Redux token hydration.
 * - Adds lightweight debug logging (toggle via localStorage key `DEBUG_AUTH_FETCH` = 'true').
 */
export default function FetchAuthMonitor() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
    if (!API_BASE) return; // nothing to do if base not defined

    const normalizeBase = (value: string) => value.replace(/\/$/, "");
    const getResolvedApiBase = () => {
      try {
        if (typeof window === "undefined") return API_BASE;
        const baseUrl = new URL(API_BASE);
        const currentHost = window.location.hostname;
        const isLocalBase = ["localhost", "127.0.0.1", "0.0.0.0"].includes(baseUrl.hostname);
        if (currentHost && isLocalBase && currentHost !== baseUrl.hostname) {
          const port = baseUrl.port ? `:${baseUrl.port}` : "";
          return `${baseUrl.protocol}//${currentHost}${port}`;
        }
      } catch {
        // ignore malformed base
      }
      return API_BASE;
    };

    type AuthMonitorWindow = Window & {
      __authFetchPatched?: boolean;
      __missingMatchIds?: Record<string, number>;
    };
    const w = window as AuthMonitorWindow;

    const originalFetch: typeof window.fetch = window.fetch.bind(window);

    // Avoid double patching
    if (w.__authFetchPatched) return;
    w.__authFetchPatched = true;

    const debug = () => localStorage.getItem("DEBUG_AUTH_FETCH") === "true";

    const missingMatchIds: Record<string, number> =
      w.__missingMatchIds || {};
    w.__missingMatchIds = missingMatchIds;
    const MISSING_MATCH_TTL_MS = 5 * 60 * 1000;

    const getDirectMatchId = (url: string): string | null => {
      try {
        const path = new URL(url).pathname;
        const match = path.match(/^\/matches\/([a-f0-9-]+)$/i);
        return match ? match[1] : null;
      } catch {
        const resolvedBase = getResolvedApiBase();
        const raw = url.replace(API_BASE, "").replace(resolvedBase, "");
        const match = raw.match(/^\/matches\/([a-f0-9-]+)$/i);
        return match ? match[1] : null;
      }
    };

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
        const resolvedBase = getResolvedApiBase();
        const baseNormalized = normalizeBase(API_BASE);
        const resolvedNormalized = normalizeBase(resolvedBase);
        const lower = url.toLowerCase();
        const isApi = (baseNormalized && lower.startsWith(baseNormalized.toLowerCase())) ||
          (resolvedNormalized && lower.startsWith(resolvedNormalized.toLowerCase()));

        const finalUrl = baseNormalized && resolvedNormalized && url.startsWith(baseNormalized)
          ? `${resolvedNormalized}${url.slice(baseNormalized.length)}`
          : url;
        let finalInput: RequestInfo | URL = input;
        if (finalUrl !== url) {
          if (typeof input === "string") {
            finalInput = finalUrl;
          } else if (input instanceof URL) {
            finalInput = new URL(finalUrl);
          } else {
            finalInput = new Request(finalUrl, input as Request);
          }
        }

        // Only patch API requests
        if (!isApi) {
          return originalFetch(input, init);
        }

        // Normalize init/headers
        const finalInit: RequestInit = init ? { ...init } : {};
        const headers: Record<string, string> = {};
        // Copy existing headers preserving case-insensitivity
        if (finalInit.headers) {
          if (finalInit.headers instanceof Headers) {
            finalInit.headers.forEach((v, k) => { headers[k] = v; });
          } else if (Array.isArray(finalInit.headers)) {
            for (const [k, v] of finalInit.headers as Array<[string, string]>) headers[k] = v;
          } else {
            Object.assign(headers, finalInit.headers as Record<string, string>);
          }
        }

        // Detect existing Authorization and treat invalid bearer values as missing.
        const authHeaderKey = Object.keys(headers).find(h => h.toLowerCase() === "authorization");
        const authHeaderValue = authHeaderKey ? String(headers[authHeaderKey] || "").trim() : "";
        const bearer = authHeaderValue.toLowerCase().startsWith("bearer ")
          ? authHeaderValue.slice(7).trim()
          : "";
        const hasValidAuth = !!(
          authHeaderKey &&
          bearer &&
          bearer !== "undefined" &&
          bearer !== "null" &&
          bearer.split(".").length === 3
        );
        const hasAuth = hasValidAuth;
        if (authHeaderKey && !hasValidAuth) {
          delete headers[authHeaderKey];
        }

        // Attempt to read token from cookies/localStorage if not present
        let token: string | undefined;
        if (!hasAuth) {
          try {
            const cookieToken = document.cookie
              .split(";")
              .map(c => c.trim())
              .find(c => c.startsWith("token="));
            if (cookieToken) {
              const tokenValue = cookieToken.split("=")[1];
              // Validate token format: must have 3 parts (JWT format)
              if (tokenValue && tokenValue !== 'undefined' && tokenValue.split('.').length === 3) {
                token = tokenValue;
              } else if (debug()) {
                console.warn("[FetchAuthMonitor] ⚠️ Invalid token format in cookie:", tokenValue?.substring(0, 20));
              }
            }
          } catch {/* ignore */}
          if (!token) {
            try {
              const stored = localStorage.getItem("auth_token") || localStorage.getItem("token") || localStorage.getItem("access_token");
              if (stored && stored !== 'undefined' && stored.split('.').length === 3) {
                token = stored;
              }
            } catch {/* ignore */}
          }
          // Fallback: parse user blob if it contains token
          if (!token) {
            try {
              const userData = localStorage.getItem("userData") || localStorage.getItem("user");
              if (userData) {
                const parsed = JSON.parse(userData);
                const potentialToken = parsed?.token || parsed?.authToken || parsed?.accessToken;
                if (potentialToken && potentialToken !== 'undefined' && potentialToken.split('.').length === 3) {
                  token = potentialToken;
                }
              }
            } catch {/* ignore */}
          }

          if (token && typeof token === "string" && token.trim().length > 0) {
            headers["Authorization"] = `Bearer ${token.trim()}`;
            if (debug()) console.info("[FetchAuthMonitor] ✅ Injected Authorization header for:", url);
          } else if (debug()) {
            console.warn("[FetchAuthMonitor] ⚠️ Missing or invalid token; request sent WITHOUT Authorization:", url);
          }
        } else if (debug()) {
          console.info("[FetchAuthMonitor] (keep) Existing Authorization header for:", url);
        }

        finalInit.headers = headers;

        // Optional: quick check if no auth yet & protected endpoint (non-blocking)
        if (!hasAuth && !headers["Authorization"]) {
          const protectedHeuristic = /\/notifications|\/leagues|\/matches|\/profile|\/players|\/dream-team|\/trophy-room|\/xp/i.test(url);
          if (protectedHeuristic) {
            // Quick single check for token (no busy-wait to avoid blocking main thread)
            try {
              const cookieToken = document.cookie
                .split(";")
                .map(c => c.trim())
                .find(c => c.startsWith("token=") || c.startsWith("auth_token="));
              if (cookieToken) {
                const newTok = cookieToken.split("=")[1];
                if (newTok && newTok !== 'undefined' && newTok.split('.').length === 3) {
                  headers["Authorization"] = `Bearer ${newTok}`;
                  finalInit.headers = headers;
                  if (debug()) console.info("[FetchAuthMonitor] ⏱ Late token attach:", url);
                }
              }
            } catch {/* ignore */}
          }
        }

        const method = (finalInit.method || "GET").toUpperCase();
        const matchId = method === "GET" ? getDirectMatchId(url) : null;
        if (matchId) {
          const lastMissing = missingMatchIds[matchId];
          if (lastMissing && Date.now() - lastMissing < MISSING_MATCH_TTL_MS) {
            if (debug()) {
              console.warn("[FetchAuthMonitor] ⏭ Skipping known-missing match:", matchId);
            }
            return new Response(null, { status: 404, statusText: "Not Found" });
          }
        }

        const res = await originalFetch(finalInput, finalInit);
        if (res.status === 401) {
          try {
            const hasCookies = document.cookie.includes("token=") || document.cookie.includes("auth_token=");
            const hasLocalStorage = localStorage.getItem("auth_token") || localStorage.getItem("token") || localStorage.getItem("access_token") || localStorage.getItem("user");
            
            if (hasCookies || hasLocalStorage) {
              console.warn("[FetchAuthMonitor] 401 Unauthorized received. Logging out user and redirecting to login...");
              
              // Clear cookies
              document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
              document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
              
              // Clear localStorage
              localStorage.removeItem("token");
              localStorage.removeItem("auth_token");
              localStorage.removeItem("access_token");
              localStorage.removeItem("user");
              localStorage.removeItem("userData");
              
              // Redirect to login page
              window.location.href = "/login?expired=1";
            }
          } catch (e) {
            console.error("[FetchAuthMonitor] Error clearing auth state on 401:", e);
          }
        }
        if (matchId) {
          if (res.status === 404) {
            missingMatchIds[matchId] = Date.now();
          } else if (res.ok && missingMatchIds[matchId]) {
            delete missingMatchIds[matchId];
          }
        }
        return res;
      } catch (err) {
        if (debug()) console.error("[FetchAuthMonitor] Patch error, falling back", err);
        return originalFetch(input, init);
      }
    };

    if (debug()) console.log("[FetchAuthMonitor] Global fetch patch active.");
  }, []);

  return null;
}
