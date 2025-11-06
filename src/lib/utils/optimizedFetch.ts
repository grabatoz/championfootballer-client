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
  const shouldCache = method === 'GET' && !skipCache;
  
  if (!shouldCache) {
    const response = await fetch(url, fetchOptions);
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
  
  return apiCache.get(
    cacheKey,
    async () => {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
