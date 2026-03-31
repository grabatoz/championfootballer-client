/**
 * Optimized Fetch Utility with Caching and Request Deduplication
 */

import { apiCache, createCacheKey } from './apiCache';

interface FetchOptions extends RequestInit {
  cache?: RequestCache;
  cacheTTL?: number;
  staleWhileRevalidate?: number;
  skipCache?: boolean;
}

const NO_CACHE_MODE = !['0', 'false', 'no', 'off'].includes(
  (process.env.NEXT_PUBLIC_NO_CACHE || 'true').toLowerCase()
);

// ETag store to support conditional requests across navigations
const ETAG_STORAGE_KEY = 'cf_etags';
const etagMap = new Map<string, string>();

// Load ETags from storage
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(ETAG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, string>;
      Object.entries(parsed).forEach(([k, v]) => etagMap.set(k, v));
    }
  } catch {}
}

let etagSaveTimer: number | null = null;
function saveEtagsThrottled() {
  if (typeof window === 'undefined') return;
  if (etagSaveTimer) window.clearTimeout(etagSaveTimer);
  etagSaveTimer = window.setTimeout(() => {
    try {
      const obj: Record<string, string> = {};
      etagMap.forEach((v, k) => (obj[k] = v));
      localStorage.setItem(ETAG_STORAGE_KEY, JSON.stringify(obj));
    } catch {}
  }, 300);
}

/**
 * Optimized fetch with automatic caching and deduplication
 */
export async function optimizedFetch<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    staleWhileRevalidate = 2 * 60 * 1000, // 2 minutes stale
    skipCache = false,
    ...fetchOptions
  } = options;
  
  // Don't cache non-GET requests
  const method = fetchOptions.method?.toUpperCase() || 'GET';
  const shouldCache = method === 'GET' && !skipCache && !NO_CACHE_MODE;
  
  if (!shouldCache) {
    const response = await fetch(url, {
      ...fetchOptions,
      ...(NO_CACHE_MODE ? { cache: 'no-store' as RequestCache } : {}),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
  
  // Create cache key including headers that affect the response
  const authHeader = fetchOptions.headers 
    ? (fetchOptions.headers as Record<string, string>)['Authorization']
    : undefined;
    
  const cacheKey = createCacheKey(url, {
    auth: authHeader ? 'authed' : 'public',
  });

  // Merge headers and attach If-None-Match when available
  const reqHeaders: Record<string, string> = {};
  if (fetchOptions.headers) {
    Object.assign(reqHeaders, fetchOptions.headers as Record<string, string>);
  }
  const knownEtag = etagMap.get(cacheKey);
  if (knownEtag) {
    reqHeaders['If-None-Match'] = knownEtag;
  }
  const finalOptions: RequestInit = { ...fetchOptions, headers: reqHeaders };
  
  return apiCache.get(
    cacheKey,
    async () => {
      let response = await fetch(url, finalOptions);
      if (response.status === 304) {
        // Use cached data when not modified
        const cached = apiCache.peek<T>(cacheKey);
        if (cached !== undefined) {
          return cached;
        }
        // If somehow no cache, refetch without conditional header
        const noCondHeaders = { ...(finalOptions.headers as Record<string, string>) };
        delete noCondHeaders['If-None-Match'];
        response = await fetch(url, { ...finalOptions, headers: noCondHeaders });
      }
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`HTTP error! status: ${response.status} ${errorText}`);
      }
      // Capture ETag if present
      const etag = response.headers.get('ETag');
      if (etag) {
        etagMap.set(cacheKey, etag);
        saveEtagsThrottled();
      }
      return response.json();
    },
    {
      ttl: cacheTTL,
      staleWhileRevalidate,
    }
  );
}

/**
 * Batch multiple fetch requests
 */
export async function batchFetch<T = unknown>(
  requests: Array<{ url: string; options?: FetchOptions }>
): Promise<T[]> {
  return Promise.all(
    requests.map(({ url, options }) => optimizedFetch<T>(url, options))
  );
}

/**
 * Invalidate cache for specific URLs
 */
export function invalidateCache(urlPattern: string | RegExp): void {
  if (typeof urlPattern === 'string') {
    const cacheKey = createCacheKey(urlPattern);
    apiCache.invalidate(cacheKey);
  } else {
    apiCache.invalidatePattern(urlPattern);
  }
}

/**
 * Prefetch data to warm up cache
 */
export function prefetch(url: string, options?: FetchOptions): void {
  optimizedFetch(url, options).catch((error) => {
    console.warn('Prefetch failed:', error);
  });
}
