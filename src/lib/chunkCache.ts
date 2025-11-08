// CHUNK-BASED CACHE WITH REAL-TIME UPDATES + BACKGROUND UPLOAD
// Advanced caching system that updates only affected chunks when data changes
// AND uploads data to server in background

import { optimizedFetch } from './httpClient';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Chunk configuration
const CHUNK_SIZE = 20; // Items per chunk
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Background upload queue
interface PendingUpload {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data?: unknown;
  retries: number;
  timestamp: number;
}

class BackgroundUploader {
  private uploads = new Map<string, PendingUpload>();
  private isUploading = false;
  private uploadTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Start auto-upload every 5 seconds
    if (typeof window !== 'undefined') {
      this.uploadTimer = setInterval(() => this.processUploads(), 5000);
    }
  }

  enqueue(upload: Omit<PendingUpload, 'id' | 'retries' | 'timestamp'>) {
    const id = `${upload.type}_${upload.endpoint}_${Date.now()}`;
    this.uploads.set(id, {
      ...upload,
      id,
      retries: 0,
      timestamp: Date.now(),
    });
    console.log(`📤 [BgUpload] Queued: ${upload.type} ${upload.endpoint}`);
    
    // Trigger immediate upload for creates
    if (upload.type === 'create') {
      setTimeout(() => this.processUploads(), 100);
    }
  }

  async processUploads() {
    if (this.isUploading || this.uploads.size === 0) return;

    this.isUploading = true;
    const batch = Array.from(this.uploads.values()).slice(0, 5); // Process 5 at a time

    for (const upload of batch) {
      try {
        await this.upload(upload);
        this.uploads.delete(upload.id);
        console.log(`✅ [BgUpload] Success: ${upload.endpoint}`);
      } catch (error) {
        upload.retries++;
        if (upload.retries >= 3) {
          console.error(`❌ [BgUpload] Failed after 3 retries: ${upload.endpoint}`, error);
          this.uploads.delete(upload.id);
        } else {
          console.warn(`⚠️ [BgUpload] Retry ${upload.retries}/3: ${upload.endpoint}`);
        }
      }
    }

    this.isUploading = false;
  }

  private async upload(item: PendingUpload) {
    const token = Cookies.get('token') || Cookies.get('auth_token');
    
    const options: RequestInit = {
      method: item.type === 'create' ? 'POST' : item.type === 'update' ? 'PUT' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    if (item.data) {
      options.body = JSON.stringify(item.data);
    }

    const response = await fetch(`${API_BASE_URL}${item.endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  getStatus() {
    return {
      pending: this.uploads.size,
      isUploading: this.isUploading,
    };
  }

  destroy() {
    if (this.uploadTimer) clearInterval(this.uploadTimer);
  }
}

const bgUploader = new BackgroundUploader();

// Cache storage
interface CacheChunk<T> {
  data: T[];
  version: number;
  expires: number;
  lastAccessed: number;
  chunkIndex: number;
  totalChunks?: number;
}

interface CacheMetadata {
  totalItems: number;
  totalChunks: number;
  version: number;
  lastUpdated: number;
}

class ChunkCacheManager {
  private chunks = new Map<string, CacheChunk<unknown>>();
  private metadata = new Map<string, CacheMetadata>();
  private listeners = new Map<string, Set<(data: unknown) => void>>();
  private refreshTimers = new Map<string, NodeJS.Timeout>();

  // Generate cache key for a specific chunk
  private getChunkKey(resource: string, chunkIndex: number): string {
    return `${resource}_chunk_${chunkIndex}`;
  }

  // Generate metadata key
  private getMetaKey(resource: string): string {
    return `${resource}_meta`;
  }

  // Load cache from localStorage
  private loadFromStorage<T>(key: string): CacheChunk<T> | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(`chunk_${key}`);
      if (!stored) return null;
      
      const chunk = JSON.parse(stored) as CacheChunk<T>;
      if (Date.now() > chunk.expires) {
        localStorage.removeItem(`chunk_${key}`);
        return null;
      }
      
      return chunk;
    } catch (e) {
      console.error(`Failed to load chunk ${key}:`, e);
      return null;
    }
  }

  // Save chunk to localStorage
  private saveToStorage<T>(key: string, chunk: CacheChunk<T>): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`chunk_${key}`, JSON.stringify(chunk));
    } catch (e) {
      console.error(`Failed to save chunk ${key}:`, e);
    }
  }

  // Get a specific chunk
  getChunk<T>(resource: string, chunkIndex: number): T[] | null {
    const key = this.getChunkKey(resource, chunkIndex);
    let chunk = this.chunks.get(key) as CacheChunk<T> | undefined;

    // Try loading from localStorage if not in memory
    if (!chunk) {
      const loaded = this.loadFromStorage<T>(key);
      if (loaded) {
        chunk = loaded;
        this.chunks.set(key, chunk);
      }
    }

    if (!chunk || Date.now() > chunk.expires) {
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    }

    // Update last accessed time
    chunk.lastAccessed = Date.now();
    console.log(`⚡ Cache HIT: ${key} (${chunk.data.length} items)`);
    
    return chunk.data;
  }

  // Set a specific chunk
  setChunk<T>(resource: string, chunkIndex: number, data: T[], totalChunks?: number): void {
    const key = this.getChunkKey(resource, chunkIndex);
    const chunk: CacheChunk<T> = {
      data,
      version: Date.now(),
      expires: Date.now() + CACHE_TTL,
      lastAccessed: Date.now(),
      chunkIndex,
      totalChunks,
    };

    this.chunks.set(key, chunk);
    this.saveToStorage(key, chunk);
    console.log(`💾 Cached chunk: ${key} (${data.length} items)`);

    // Update metadata
    const meta = this.metadata.get(resource) || {
      totalItems: 0,
      totalChunks: 0,
      version: 0,
      lastUpdated: 0,
    };
    
    meta.lastUpdated = Date.now();
    meta.version++;
    if (totalChunks !== undefined) {
      meta.totalChunks = totalChunks;
    }
    
    this.metadata.set(resource, meta);

    // Notify listeners
    this.notifyListeners(resource, data);
  }

  // Get all chunks for a resource
  async getAllChunks<T>(resource: string): Promise<T[]> {
    const meta = this.metadata.get(resource);
    if (!meta || meta.totalChunks === 0) {
      console.log(`No metadata found for ${resource}, fetching fresh...`);
      return [];
    }

    const allData: T[] = [];
    for (let i = 0; i < meta.totalChunks; i++) {
      const chunk = this.getChunk<T>(resource, i);
      if (chunk) {
        allData.push(...chunk);
      }
    }

    return allData;
  }

  // Update a single item in cache (real-time update)
  updateItem<T extends { id: string }>(resource: string, updatedItem: T, uploadToServer = true): void {
    console.log(`🔄 Updating item ${updatedItem.id} in ${resource}`);
    
    // Find which chunk contains this item
    for (const [key, chunk] of this.chunks.entries()) {
      if (key.startsWith(resource)) {
        const data = chunk.data as T[];
        const index = data.findIndex((item) => item.id === updatedItem.id);
        
        if (index !== -1) {
          // Update the item in place
          data[index] = { ...data[index], ...updatedItem };
          chunk.version = Date.now();
          
          // Save to storage
          this.saveToStorage(key, chunk);
          console.log(`✅ Updated item in ${key}`);
          
          // Upload to server in background
          if (uploadToServer) {
            bgUploader.enqueue({
              type: 'update',
              endpoint: `/${resource}/${updatedItem.id}`,
              data: updatedItem,
            });
          }
          
          // Notify listeners
          this.notifyListeners(resource, updatedItem);
          return;
        }
      }
    }
    
    console.log(`⚠️ Item ${updatedItem.id} not found in cache, invalidating...`);
    this.invalidate(resource);
  }

  // Add a new item to cache (prepend to first chunk)
  addItem<T extends { id: string }>(resource: string, newItem: T, uploadToServer = true): void {
    console.log(`➕ Adding new item ${newItem.id} to ${resource}`);
    
    const firstChunkKey = this.getChunkKey(resource, 0);
    const chunk = this.chunks.get(firstChunkKey);
    
    if (chunk) {
      const data = chunk.data as T[];
      
      // Check if item already exists
      if (data.some((item) => item.id === newItem.id)) {
        console.log(`Item ${newItem.id} already exists, updating instead`);
        this.updateItem(resource, newItem, uploadToServer);
        return;
      }
      
      // Prepend new item
      data.unshift(newItem);
      chunk.version = Date.now();
      
      // If chunk exceeds size, shift last item to next chunk
      if (data.length > CHUNK_SIZE) {
        const overflow = data.pop();
        if (overflow) {
          this.shiftToNextChunk(resource, 1, overflow as T);
        }
      }
      
      this.saveToStorage(firstChunkKey, chunk);
      console.log(`✅ Added item to ${firstChunkKey}`);
      
      // Update metadata
      const meta = this.metadata.get(resource);
      if (meta) {
        meta.totalItems++;
        meta.lastUpdated = Date.now();
        meta.version++;
      }
      
      // Upload to server in background
      if (uploadToServer) {
        bgUploader.enqueue({
          type: 'create',
          endpoint: `/${resource}`,
          data: newItem,
        });
      }
      
      // Notify listeners
      this.notifyListeners(resource, newItem);
    } else {
      console.log(`First chunk not found, invalidating cache for ${resource}`);
      this.invalidate(resource);
    }
  }

  // Remove an item from cache
  removeItem<T extends { id: string }>(resource: string, itemId: string, uploadToServer = true): void {
    console.log(`🗑️ Removing item ${itemId} from ${resource}`);
    
    for (const [key, chunk] of this.chunks.entries()) {
      if (key.startsWith(resource)) {
        const data = chunk.data as T[];
        const index = data.findIndex((item) => item.id === itemId);
        
        if (index !== -1) {
          data.splice(index, 1);
          chunk.version = Date.now();
          
          this.saveToStorage(key, chunk);
          console.log(`✅ Removed item from ${key}`);
          
          // Update metadata
          const meta = this.metadata.get(resource);
          if (meta) {
            meta.totalItems--;
            meta.lastUpdated = Date.now();
            meta.version++;
          }
          
          // Upload deletion to server in background
          if (uploadToServer) {
            bgUploader.enqueue({
              type: 'delete',
              endpoint: `/${resource}/${itemId}`,
            });
          }
          
          // Notify listeners
          this.notifyListeners(resource, { id: itemId, _deleted: true });
          return;
        }
      }
    }
  }

  // Helper to shift item to next chunk
  private shiftToNextChunk<T>(resource: string, chunkIndex: number, item: T): void {
    const nextKey = this.getChunkKey(resource, chunkIndex);
    const nextChunk = this.chunks.get(nextKey);
    
    if (nextChunk) {
      const data = nextChunk.data as T[];
      data.unshift(item);
      
      if (data.length > CHUNK_SIZE) {
        const overflow = data.pop();
        if (overflow) {
          this.shiftToNextChunk(resource, chunkIndex + 1, overflow);
        }
      }
      
      this.saveToStorage(nextKey, nextChunk);
    }
  }

  // Subscribe to cache updates
  subscribe<T>(resource: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(resource)) {
      this.listeners.set(resource, new Set());
    }
    
    const listeners = this.listeners.get(resource)!;
    listeners.add(callback as (data: unknown) => void);
    
    console.log(`👂 Subscribed to ${resource} (${listeners.size} listeners)`);
    
    // Return unsubscribe function
    return () => {
      listeners.delete(callback as (data: unknown) => void);
      console.log(`🔇 Unsubscribed from ${resource}`);
    };
  }

  // Notify all listeners
  private notifyListeners(resource: string, data: unknown): void {
    const listeners = this.listeners.get(resource);
    if (listeners && listeners.size > 0) {
      console.log(`📢 Notifying ${listeners.size} listeners for ${resource}`);
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (e) {
          console.error('Listener callback error:', e);
        }
      });
    }
  }

  // Invalidate cache for a resource
  invalidate(resource: string): void {
    console.log(`🗑️ Invalidating cache for ${resource}`);
    
    // Remove all chunks
    const keysToDelete: string[] = [];
    for (const key of this.chunks.keys()) {
      if (key.startsWith(resource)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach((key) => {
      this.chunks.delete(key);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`chunk_${key}`);
      }
    });
    
    // Clear metadata
    this.metadata.delete(resource);
    
    // Cancel refresh timer
    const timer = this.refreshTimers.get(resource);
    if (timer) {
      clearTimeout(timer);
      this.refreshTimers.delete(resource);
    }
    
    console.log(`✅ Invalidated ${keysToDelete.length} chunks for ${resource}`);
  }

  // Invalidate all caches
  invalidateAll(): void {
    console.log('🗑️ Invalidating ALL caches');
    this.chunks.clear();
    this.metadata.clear();
    this.refreshTimers.forEach((timer) => clearTimeout(timer));
    this.refreshTimers.clear();
    
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('chunk_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  // Get cache statistics
  getStats(): Record<string, unknown> {
    const stats = {
      totalChunks: this.chunks.size,
      totalMetadata: this.metadata.size,
      totalListeners: Array.from(this.listeners.values()).reduce(
        (sum, set) => sum + set.size,
        0
      ),
      uploadStatus: bgUploader.getStatus(),
      resources: {} as Record<string, unknown>,
    };

    for (const [resource, meta] of this.metadata.entries()) {
      const chunks = Array.from(this.chunks.keys()).filter((key) =>
        key.startsWith(resource)
      ).length;
      
      stats.resources[resource] = {
        totalItems: meta.totalItems,
        totalChunks: meta.totalChunks,
        cachedChunks: chunks,
        lastUpdated: new Date(meta.lastUpdated).toLocaleTimeString(),
      };
    }

    return stats;
  }
}

// Singleton instance
export const chunkCache = new ChunkCacheManager();

// Fetcher with chunk support
interface FetchOptions {
  forceRefresh?: boolean;
  page?: number;
  limit?: number;
}

export async function fetchWithChunks<T>(
  resource: string,
  endpoint: string,
  options: FetchOptions = {}
): Promise<T[]> {
  const { forceRefresh = false, page = 0, limit = CHUNK_SIZE } = options;
  
  // Check cache first
  if (!forceRefresh) {
    const cached = chunkCache.getChunk<T>(resource, page);
    if (cached) {
      return cached;
    }
  }

  console.log(`🌐 Fetching ${resource} chunk ${page}...`);
  
  try {
    const token = Cookies.get('token') || Cookies.get('auth_token');
    const url = `${API_BASE_URL}${endpoint}?page=${page}&limit=${limit}`;
    
    const response = await optimizedFetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract array from response
    let items: T[] = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data.data && Array.isArray(data.data)) {
      items = data.data;
    } else if (data.leagues && Array.isArray(data.leagues)) {
      items = data.leagues as T[];
    } else if (data.matches && Array.isArray(data.matches)) {
      items = data.matches as T[];
    } else if (data.players && Array.isArray(data.players)) {
      items = data.players as T[];
    }

    // Calculate total chunks
    const totalChunks = Math.ceil(items.length / limit);
    
    // Cache the chunk
    chunkCache.setChunk(resource, page, items, totalChunks);
    
    return items;
  } catch (error) {
    console.error(`Failed to fetch ${resource}:`, error);
    throw error;
  }
}

// Real-time update helpers
export function updateCachedItem<T extends { id: string }>(
  resource: string,
  item: T
): void {
  chunkCache.updateItem(resource, item);
}

export function addCachedItem<T extends { id: string }>(
  resource: string,
  item: T
): void {
  chunkCache.addItem(resource, item);
}

export function removeCachedItem(resource: string, itemId: string): void {
  chunkCache.removeItem(resource, itemId);
}

export function subscribeToCacheUpdates<T>(
  resource: string,
  callback: (data: T) => void
): () => void {
  return chunkCache.subscribe(resource, callback);
}

export function invalidateCache(resource?: string): void {
  if (resource) {
    chunkCache.invalidate(resource);
  } else {
    chunkCache.invalidateAll();
  }
}

export function getCacheStats(): Record<string, unknown> {
  return chunkCache.getStats();
}

// Force process pending uploads
export function forceUploadSync(): Promise<void> {
  return bgUploader.processUploads();
}

// Get upload queue status
export function getUploadStatus() {
  return bgUploader.getStatus();
}
