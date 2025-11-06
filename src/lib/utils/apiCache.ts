/**
 * Advanced API Caching Utility
 * Implements in-memory cache with TTL, stale-while-revalidate pattern
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: number; // Additional time to serve stale data while revalidating
}

class APICache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private pendingRequests = new Map<string, Promise<unknown>>();
  
  // Default TTL: 5 minutes
  private defaultTTL = 5 * 60 * 1000;
  
  /**
   * Get cached data or fetch new data
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const ttl = options.ttl ?? this.defaultTTL;
    const swr = options.staleWhileRevalidate ?? 0;
    const now = Date.now();
    
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    
    // Check if we have valid cached data
    if (cached && now < cached.expiresAt) {
      return cached.data;
    }
    
    // Check if we can serve stale data while revalidating
    if (cached && swr > 0 && now < cached.expiresAt + swr) {
      // Serve stale data immediately
      this.revalidateInBackground(key, fetcher, ttl);
      return cached.data;
    }
    
    // Check if there's already a pending request for this key
    const pending = this.pendingRequests.get(key) as Promise<T> | undefined;
    if (pending) {
      return pending;
    }
    
    // Fetch new data
    const promise = this.fetchAndCache(key, fetcher, ttl);
    this.pendingRequests.set(key, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }
  
  /**
   * Fetch data and store in cache
   */
  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    try {
      const data = await fetcher();
      const now = Date.now();
      
      this.cache.set(key, {
        data,
        timestamp: now,
        expiresAt: now + ttl,
      });
      
      return data;
    } catch (error) {
      // If fetch fails and we have stale data, return it
      const cached = this.cache.get(key) as CacheEntry<T> | undefined;
      if (cached) {
        console.warn(`Fetch failed for ${key}, serving stale data`, error);
        return cached.data;
      }
      throw error;
    }
  }
  
  /**
   * Revalidate in the background (fire and forget)
   */
  private revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): void {
    this.fetchAndCache(key, fetcher, ttl).catch((error) => {
      console.error(`Background revalidation failed for ${key}:`, error);
    });
  }
  
  /**
   * Manually invalidate a cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Invalidate entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
  
  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
  
  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt + (5 * 60 * 1000)) { // Keep stale data for 5 more minutes
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
    };
  }
}

// Singleton instance
export const apiCache = new APICache();

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Helper function to create cache keys
 */
export function createCacheKey(
  endpoint: string,
  params?: Record<string, unknown>
): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
    
  return `${endpoint}?${sortedParams}`;
}
