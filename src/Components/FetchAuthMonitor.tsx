"use client";
import React, { useEffect } from "react";

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

    const originalFetch: typeof window.fetch = window.fetch.bind(window);

    // Avoid double patching
    if ((window as any).__authFetchPatched) return;
    (window as any).__authFetchPatched = true;

    const debug = () => localStorage.getItem("DEBUG_AUTH_FETCH") === "true";

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
        const lower = url.toLowerCase();
        const isApi = API_BASE && lower.startsWith(API_BASE.toLowerCase());

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

        // Detect existing Authorization
        const hasAuth = Object.keys(headers).some(h => h.toLowerCase() === "authorization");

        // Attempt to read token from cookies/localStorage if not present
        let token: string | undefined;
        if (!hasAuth) {
          try {
            const cookieToken = document.cookie
              .split(";")
              .map(c => c.trim())
              .find(c => c.startsWith("token=") || c.startsWith("auth_token="));
            if (cookieToken) token = cookieToken.split("=")[1];
          } catch {/* ignore */}
          if (!token) {
            try {
              const stored = localStorage.getItem("auth_token") || localStorage.getItem("token") || localStorage.getItem("access_token");
              if (stored) token = stored;
            } catch {/* ignore */}
          }
          // Fallback: parse user blob if it contains token
          if (!token) {
            try {
              const userData = localStorage.getItem("userData") || localStorage.getItem("user");
              if (userData) {
                const parsed = JSON.parse(userData);
                token = parsed?.token || parsed?.authToken || parsed?.accessToken;
              }
            } catch {/* ignore */}
          }

          if (token && typeof token === "string" && token.trim().length > 0) {
            headers["Authorization"] = `Bearer ${token.trim()}`;
            if (debug()) console.info("[FetchAuthMonitor] ✅ Injected Authorization header for:", url);
          } else if (debug()) {
            console.warn("[FetchAuthMonitor] ⚠️ Missing token; request sent WITHOUT Authorization:", url);
          }
        } else if (debug()) {
          console.info("[FetchAuthMonitor] (keep) Existing Authorization header for:", url);
        }

        finalInit.headers = headers;

        // Optional: small delay if no auth yet & protected endpoint heuristics (avoid spamming server)
        if (!hasAuth && !headers["Authorization"]) {
          const protectedHeuristic = /\/notifications|\/leagues|\/matches|\/profile|\/players|\/dream-team|\/trophy-room|\/xp/i.test(url);
          if (protectedHeuristic) {
            // Wait briefly for token to appear (up to 350ms)
            const start = performance.now();
            while (performance.now() - start < 350) {
              const cookieToken = document.cookie
                .split(";")
                .map(c => c.trim())
                .find(c => c.startsWith("token=") || c.startsWith("auth_token="));
              if (cookieToken) {
                const newTok = cookieToken.split("=")[1];
                if (newTok) {
                  headers["Authorization"] = `Bearer ${newTok}`;
                  finalInit.headers = headers;
                  if (debug()) console.info("[FetchAuthMonitor] ⏱ Late token attach after wait:", url);
                  break;
                }
              }
            }
          }
        }

        return originalFetch(input, finalInit);
      } catch (err) {
        if (debug()) console.error("[FetchAuthMonitor] Patch error, falling back", err);
        return originalFetch(input, init);
      }
    };

    if (debug()) console.log("[FetchAuthMonitor] Global fetch patch active.");
  }, []);

  return null;
}
