/**
 * Advanced API Caching Utility
 * Implements in-memory cache with TTL, stale-while-revalidate pattern
 * WITH BACKGROUND UPLOAD SUPPORT
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: number; // Additional time to serve stale data while revalidating
  uploadOnChange?: boolean; // Auto-upload changes to server
}

// Upload queue for background sync
interface UploadTask {
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data?: unknown;
  retries: number;
}

class UploadQueue {
  private queue: UploadTask[] = [];
  private isProcessing = false;

  add(task: Omit<UploadTask, 'retries'>) {
    this.queue.push({ ...task, retries: 0 });
    console.log(`📤 [ApiCache] Queued upload: ${task.method} ${task.url}`);
    
    // Process immediately for critical operations
    if (task.method === 'POST' || task.method === 'DELETE') {
      setTimeout(() => this.process(), 50);
    }
  }

  async process() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const batch = this.queue.splice(0, 3); // Process 3 at a time

    for (const task of batch) {
      try {
        await this.upload(task);
        console.log(`✅ [ApiCache] Uploaded: ${task.method} ${task.url}`);
      } catch (error) {
        task.retries++;
        if (task.retries < 3) {
          this.queue.push(task); // Re-queue
          console.warn(`⚠️ [ApiCache] Retry ${task.retries}/3: ${task.url}`);
        } else {
          console.error(`❌ [ApiCache] Failed: ${task.url}`, error);
        }
      }
    }

    this.isProcessing = false;
    
    // Continue processing if more items
    if (this.queue.length > 0) {
      setTimeout(() => this.process(), 100);
    }
  }

  private async upload(task: UploadTask) {
    const token = typeof document !== 'undefined'
      ? document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
      : undefined;

    const options: RequestInit = {
      method: task.method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    if (task.data) {
      options.body = JSON.stringify(task.data);
    }

    const response = await fetch(task.url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  getStatus() {
    return {
      pending: this.queue.length,
      isProcessing: this.isProcessing,
    };
  }
}

const uploadQueue = new UploadQueue();

// Auto-process upload queue every 5 seconds
if (typeof window !== 'undefined') {
  setInterval(() => uploadQueue.process(), 5000);
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
   * Peek at a valid cache entry without fetching
   */
  peek<T>(key: string): T | undefined {
    const now = Date.now();
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    if (cached && now < cached.expiresAt) {
      return cached.data;
    }
    return undefined;
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
   * Set cache manually and optionally upload to server
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl ?? this.defaultTTL;
    const now = Date.now();
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });

    // Upload to server if requested
    if (options.uploadOnChange) {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      uploadQueue.add({
        url: `${API_BASE_URL}${key}`,
        method: 'POST',
        data,
      });
    }
  }

  /**
   * Update existing cache entry and upload to server
   */
  update<T>(key: string, data: Partial<T>, uploadToServer = true): void {
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (cached) {
      const updated = { ...cached.data, ...data };
      this.cache.set(key, {
        ...cached,
        data: updated,
        timestamp: Date.now(),
      });

      if (uploadToServer) {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        uploadQueue.add({
          url: `${API_BASE_URL}${key}`,
          method: 'PUT',
          data: updated,
        });
      }
    }
  }

  /**
   * Delete cache entry and optionally delete from server
   */
  delete(key: string, deleteFromServer = true): void {
    this.cache.delete(key);

    if (deleteFromServer) {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      uploadQueue.add({
        url: `${API_BASE_URL}${key}`,
        method: 'DELETE',
      });
    }
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
   * Manually invalidate a cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Get cache statistics including upload queue status
   */
  getStats() {
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      uploadQueue: uploadQueue.getStatus(),
    };
  }

  /**
   * Force process upload queue
   */
  async syncNow(): Promise<void> {
    return uploadQueue.process();
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

/**
 * Get upload queue status
 */
export function getUploadQueueStatus() {
  return uploadQueue.getStatus();
}

/**
 * Force sync upload queue immediately
 */
export function forceSyncUploads(): Promise<void> {
  return uploadQueue.process();
}
