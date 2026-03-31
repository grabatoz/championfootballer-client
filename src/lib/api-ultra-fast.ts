// ULTRA FAST API WITH INSTANT CACHE - No delays on tab switching!
import { ApiResponse, LoginCredentials, RegisterCredentials, CreateLeagueDTO, CreateMatchDTO, UpdateMatchDTO } from '@/types/api';
import { User, League, Match } from '@/types/user';
import Cookies from 'js-cookie';
import { getAuthToken } from './tokenManager';
import type {
  LeaguesResponse,
  LeaderboardResponse,
  PlayersResponse,
  MatchesResponse,
  PlayerStatsResponse
} from '@/types/api';
import { optimizedFetch } from './httpClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const NO_CACHE_MODE = !['0', 'false', 'no', 'off'].includes(
  (process.env.NEXT_PUBLIC_NO_CACHE || 'true').toLowerCase()
);

// Cache with instant retrieval
interface InstantCache<T> {
  data: T;
  expires: number;
  timestamp: number;
}

const instantCache = new Map<string, InstantCache<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'cf_instant_cache';
const CHUNK_SIZE = 50; // Items per chunk for large arrays

// Chunk-based cache for progressive loading
interface ChunkedCache<T> {
  chunks: T[][];
  totalItems: number;
  lastUpdate: number;
  expires: number;
  isComplete: boolean;
}

const chunkedCache = new Map<string, ChunkedCache<unknown>>();

// Load cache from localStorage synchronously on init
if (typeof window !== 'undefined') {
  if (NO_CACHE_MODE) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + '_chunked');
  } else {
    try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.entries(parsed).forEach(([key, value]) => {
        const cache = value as InstantCache<unknown>;
        if (Date.now() < cache.expires) {
          instantCache.set(key, cache);
        }
      });
      console.log(`⚡ Instant cache loaded: ${instantCache.size} items`);
    }

    // Load chunked cache
    const chunkedStored = localStorage.getItem(STORAGE_KEY + '_chunked');
    if (chunkedStored) {
      const parsed = JSON.parse(chunkedStored);
      Object.entries(parsed).forEach(([key, value]) => {
        const cache = value as ChunkedCache<unknown>;
        if (Date.now() < cache.expires) {
          chunkedCache.set(key, cache);
        }
      });
      console.log(`📦 Chunked cache loaded: ${chunkedCache.size} collections`);
    }
    } catch (e) {
      console.error('Cache load error:', e);
    }
  }
}

// Save cache to localStorage (throttled)
let saveTimeout: NodeJS.Timeout | null = null;
function saveCache() {
  if (typeof window === 'undefined' || NO_CACHE_MODE) return;
  
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      // Save regular instant cache
      const cacheObj: Record<string, InstantCache<unknown>> = {};
      instantCache.forEach((value, key) => {
        if (Date.now() < value.expires) {
          cacheObj[key] = value;
        }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheObj));

      // Save chunked cache separately
      const chunkedObj: Record<string, ChunkedCache<unknown>> = {};
      chunkedCache.forEach((value, key) => {
        if (Date.now() < value.expires) {
          chunkedObj[key] = value;
        }
      });
      localStorage.setItem(STORAGE_KEY + '_chunked', JSON.stringify(chunkedObj));
      
      console.log(`💾 Cache saved: ${instantCache.size} instant + ${chunkedCache.size} chunked`);
    } catch (e) {
      console.error('Cache save error:', e);
    }
  }, 500);
}

// Get from cache instantly (synchronous)
function getCacheInstant<T>(key: string): T | null {
  if (NO_CACHE_MODE) return null;
  const cached = instantCache.get(key);
  if (cached && Date.now() < cached.expires) {
    console.log(`⚡ INSTANT HIT: ${key} (${Date.now() - cached.timestamp}ms old)`);
    return cached.data as T;
  }
  return null;
}

// Set cache
function setCacheInstant<T>(key: string, data: T, ttl: number = CACHE_TTL) {
  if (NO_CACHE_MODE) return;
  instantCache.set(key, {
    data,
    expires: Date.now() + ttl,
    timestamp: Date.now()
  });
  saveCache();
}

// Progressive chunk-based cache setters
function setCacheChunked<T>(key: string, items: T[], ttl: number = CACHE_TTL) {
  if (NO_CACHE_MODE) return;
  const chunks: T[][] = [];
  
  // Split into chunks
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    chunks.push(items.slice(i, i + CHUNK_SIZE));
  }
  
  chunkedCache.set(key, {
    chunks,
    totalItems: items.length,
    lastUpdate: Date.now(),
    expires: Date.now() + ttl,
    isComplete: true
  });
  
  // Also save flat version for instant retrieval
  setCacheInstant(key, items, ttl);
  
  console.log(`📦 Chunked cache set: ${key} (${chunks.length} chunks, ${items.length} items)`);
}

// Get chunked cache progressively (returns chunks one by one)
function* getCacheChunkedGenerator<T>(key: string): Generator<T[], void, void> {
  const cached = chunkedCache.get(key);
  if (cached && Date.now() < cached.expires) {
    console.log(`📦 Chunked cache hit: ${key} (${cached.chunks.length} chunks)`);
    for (const chunk of cached.chunks) {
      yield chunk as T[];
    }
  }
}

// Get all chunks at once (flattened)
function getCacheChunkedAll<T>(key: string): T[] | null {
  const cached = chunkedCache.get(key);
  if (cached && Date.now() < cached.expires) {
    const flattened = (cached.chunks as T[][]).flat();
    console.log(`📦 Chunked cache hit (flat): ${key} (${flattened.length} items)`);
    return flattened;
  }
  return null;
}

// Event system for real-time cache updates
const cacheEventListeners = new Map<string, Set<(data: unknown) => void>>();

// Dispatch cache update event
function dispatchCacheEvent(key: string, data: unknown) {
  const listeners = cacheEventListeners.get(key);
  if (listeners) {
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error('Cache event listener error:', err);
      }
    });
  }
}

// Subscribe to cache updates
export function onCacheUpdate(key: string, callback: (data: unknown) => void) {
  if (!cacheEventListeners.has(key)) {
    cacheEventListeners.set(key, new Set());
  }
  cacheEventListeners.get(key)!.add(callback);
  
  // Return unsubscribe function
  return () => {
    const listeners = cacheEventListeners.get(key);
    if (listeners) {
      listeners.delete(callback);
    }
  };
}

// ULTRA FAST FETCH - Returns cache instantly, updates in background
async function ultraFastFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  cacheKey?: string
): Promise<T> {
  const isGetRequest = !options.method || options.method === 'GET';
  
  // For GET requests, return cache instantly if available
  if (cacheKey && isGetRequest) {
    const cached = getCacheInstant<T>(cacheKey);
    if (cached) {
      // Update in background (don't await)
      setTimeout(() => {
        const token = getAuthToken();
        const requiresAuth = !endpoint.includes('/auth/login') &&
                             !endpoint.includes('/auth/register') &&
                             !endpoint.includes('/health') &&
                             !endpoint.includes('/events');

        // During early app bootstrap, auth state may not be hydrated yet.
        // Skip background refresh quietly to avoid noisy production failures.
        if (requiresAuth && !token) return;

        fetchAndCache<T>(endpoint, options, cacheKey).catch(err =>
          console.error('Background update failed:', err)
        );
      }, 100);
      
      return cached; // Return immediately!
    }
  }

  // No cache, fetch now
  return await fetchAndCache<T>(endpoint, options, cacheKey);
}

// Actual fetch with caching
async function fetchAndCache<T>(
  endpoint: string,
  options: RequestInit,
  cacheKey?: string
): Promise<T> {
  const token = getAuthToken(); // Use TokenManager for auto-recovery
  
  // Check if endpoint requires auth and token is missing
  const requiresAuth = !endpoint.includes('/auth/login') && 
                       !endpoint.includes('/auth/register') && 
                       !endpoint.includes('/health') &&
                       !endpoint.includes('/events');
  
  if (requiresAuth && !token) {
    console.error('❌ fetchAndCache: No valid token for authenticated endpoint:', endpoint);
    throw new Error('Authentication required - no valid token found');
  }
  
  // Build headers object safely from any RequestInit headers type
  const headers: Record<string, string> = {};
  if (options.headers instanceof Headers) {
    options.headers.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (Array.isArray(options.headers)) {
    for (const [key, value] of options.headers) {
      headers[key] = value;
    }
  } else if (options.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData =
    typeof FormData !== 'undefined' &&
    typeof options.body === 'object' &&
    options.body instanceof FormData;
  const hasContentType = Object.keys(headers).some((h) => h.toLowerCase() === 'content-type');
  if (hasBody && !isFormData && !hasContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log(`📤 fetchAndCache: ${endpoint}`, {
    hasToken: !!token,
    tokenLength: token?.length,
    headers: Object.keys(headers),
    requiresAuth
  });
  
  const response = await optimizedFetch(API_BASE_URL + endpoint, {
    ...options,
    headers,
  });

  // Clone response before reading to avoid "body already read" error
  // (response can be shared due to request deduplication)
  const responseClone = response.clone();

  if (!response.ok) {
    const errorText = await responseClone.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }
  
  const data = await responseClone.json();
  
  // Cache GET requests
  if (cacheKey && (!options.method || options.method === 'GET')) {
    setCacheInstant(cacheKey, data);
  }
  
  return data;
}

// AUTH API
interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<User>> => {
    try {
      const data = await fetchAndCache<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ user: credentials }),
      });
      
      return {
        success: true,
        data: data.user,
        token: data.token,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  },

  register: async (credentials: RegisterCredentials): Promise<ApiResponse<User>> => {
    try {
      const data = await fetchAndCache<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ user: credentials }),
      });
      
      return {
        success: true,
        data: data.user,
        token: data.token,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        message: 'Registration failed',
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  },

  getUserData: async (): Promise<ApiResponse<User>> => {
    try {
      console.log('📤 getUserData: Fetching with token...');
      const token = getAuthToken();
      console.log('🔑 getUserData: Token available:', !!token, 'length:', token?.length);
      
      const data = await ultraFastFetch<{ user: User }>('/auth/data', {}, 'user_data');
      return {
        success: true,
        data: data.user,
        message: 'User data fetched'
      };
    } catch (error) {
      console.error('❌ getUserData error:', error);
      return {
        success: false,
        message: 'Failed to fetch user data',
        error: error instanceof Error ? error.message : 'Failed to fetch user data'
      };
    }
  },

  logout: async (): Promise<ApiResponse<null>> => {
    try {
      await fetchAndCache<{ message: string }>('/auth/logout', { method: 'POST' });
      Cookies.remove('token');
      Cookies.remove('auth_token');
      
      // Clear all caches (instant + chunked)
      instantCache.clear();
      chunkedCache.clear();
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY + '_chunked');
      }
      
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Logout failed',
        error: error instanceof Error ? error.message : 'Logout failed'
      };
    }
  }
};

// LEAGUES API - INSTANT CACHE + CHUNKED
export const leagueAPI = {
  /**
   * Get all leagues - instantly from cache if available
   * Returns cached data immediately (0ms), updates in background
   */
  getAll: async (): Promise<LeaguesResponse> => {
    const response = await ultraFastFetch<LeaguesResponse>('/leagues', {}, 'leagues_all');
    
    // If response has leagues array, save in chunks for progressive loading
    if (response?.leagues && Array.isArray(response.leagues)) {
      setCacheChunked('leagues_chunked', response.leagues);
      console.log(`📦 Leagues cached in chunks: ${response.leagues.length} total`);
    }
    
    return response;
  },

  /**
   * Get all leagues INSTANTLY (synchronous)
   * Returns cached leagues array immediately without waiting
   * If cache is empty, triggers background fetch
   */
  getAllInstant: (): League[] => {
    const cached = getCacheInstant<LeaguesResponse>('leagues_all');
    
    // If no cache, trigger background fetch (don't wait for it)
    if (!cached) {
      const token = getAuthToken();
      if (!token) {
        return [];
      }
      console.log('⚡ getAllInstant: No cache, triggering background fetch...');
      leagueAPI.getAll().catch(err => 
        console.error('❌ Background fetch failed:', err)
      );
      return []; // Return empty array temporarily
    }
    
    return (cached?.leagues || []) as League[];
  },

  /**
   * Get leagues in chunks progressively (for smooth UI rendering)
   * Returns a generator that yields chunks of leagues
   */
  getAllChunked: function* (): Generator<League[], void, void> {
    const generator = getCacheChunkedGenerator<League>('leagues_chunked');
    for (const chunk of generator) {
      yield chunk;
    }
  },

  /**
   * Get all chunked leagues at once (flattened array)
   */
  getAllChunkedFlat: (): League[] => {
    return getCacheChunkedAll<League>('leagues_chunked') || leagueAPI.getAllInstant();
  },

  /**
   * Invalidate leagues cache
   * Call this after creating/updating/deleting a league
   */
  invalidateCache: () => {
    instantCache.delete('leagues_all');
    chunkedCache.delete('leagues_chunked');
    dispatchCacheEvent('leagues_all', null);
  },

  create: async (league: CreateLeagueDTO): Promise<ApiResponse<League>> => {
    try {
      const data = await fetchAndCache<{ league: League }>('/leagues', {
        method: 'POST',
        body: JSON.stringify(league),
      });
      
      // Invalidate leagues cache
      instantCache.delete('leagues_all');
      
      return { success: true, data: data.league, message: 'League created successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create league',
        error: error instanceof Error ? error.message : 'Failed to create league'
      };
    }
  },

  getById: async (id: string): Promise<ApiResponse<League>> => {
    try {
      const data = await ultraFastFetch<{ league: League }>(`/leagues/${id}`, {}, `league_${id}`);
      return { success: true, data: data.league, message: 'League fetched successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch league',
        error: error instanceof Error ? error.message : 'Failed to fetch league'
      };
    }
  },

  join: async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    try {
      const data = await fetchAndCache<{ success: boolean; message: string }>(`/leagues/${id}/join`, { method: 'POST' });
      
      // Invalidate caches
      instantCache.delete('leagues_all');
      instantCache.delete(`league_${id}`);
      
      return { success: true, data, message: 'Joined league successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to join league',
        error: error instanceof Error ? error.message : 'Failed to join league'
      };
    }
  },

  leave: async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    try {
      const data = await fetchAndCache<{ success: boolean; message: string }>(`/leagues/${id}/leave`, { method: 'POST' });
      
      // Invalidate caches
      instantCache.delete('leagues_all');
      instantCache.delete(`league_${id}`);
      
      return { success: true, data, message: 'Left league successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to leave league',
        error: error instanceof Error ? error.message : 'Failed to leave league'
      };
    }
  },

  delete: async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    try {
      const data = await fetchAndCache<{ success: boolean; message: string }>(`/leagues/${id}`, { method: 'DELETE' });
      
      // Clear all league-related caches
      instantCache.forEach((_, key) => {
        if (key.includes('league')) {
          instantCache.delete(key);
        }
      });
      
      return { success: true, data, message: 'League deleted successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete league',
        error: error instanceof Error ? error.message : 'Failed to delete league'
      };
    }
  }
};

// MATCHES API - INSTANT CACHE + CHUNKED
export const matchAPI = {
  getAll: async (): Promise<MatchesResponse> => {
    const response = await ultraFastFetch<MatchesResponse>('/matches', {}, 'matches_all');
    
    // Save matches in chunks
    if (response?.matches && Array.isArray(response.matches)) {
      setCacheChunked('matches_chunked', response.matches);
      console.log(`📦 Matches cached in chunks: ${response.matches.length} total`);
    }
    
    return response;
  },

  getAllChunked: function* (): Generator<Match[], void, void> {
    const generator = getCacheChunkedGenerator<Match>('matches_chunked');
    for (const chunk of generator) {
      yield chunk;
    }
  },

  getByLeague: async (leagueId: string): Promise<MatchesResponse> => {
    const response = await ultraFastFetch<MatchesResponse>(`/matches?leagueId=${leagueId}`, {}, `matches_league_${leagueId}`);
    
    // Save league matches in chunks
    if (response?.matches && Array.isArray(response.matches)) {
      setCacheChunked(`matches_league_${leagueId}_chunked`, response.matches);
    }
    
    return response;
  },

  getByLeagueChunked: function* (leagueId: string): Generator<Match[], void, void> {
    const generator = getCacheChunkedGenerator<Match>(`matches_league_${leagueId}_chunked`);
    for (const chunk of generator) {
      yield chunk;
    }
  },

  create: async (match: CreateMatchDTO): Promise<ApiResponse<Match>> => {
    try {
      const data = await fetchAndCache<{ match: Match }>('/matches', {
        method: 'POST',
        body: JSON.stringify(match),
      });
      
      // 🗑️ AGGRESSIVELY clear ALL match and league caches
      console.log('🗑️ Clearing all match caches after creation...');
      
      // Clear instant cache
      instantCache.delete('matches_all');
      instantCache.delete(`matches_league_${match.leagueId}`);
      instantCache.delete(`league_${match.leagueId}`);
      
      // Clear chunked cache
      chunkedCache.delete('matches_chunked');
      chunkedCache.delete(`matches_league_${match.leagueId}_chunked`);
      
      // Clear localStorage completely for matches and leagues
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY + '_chunked');
        
        // Clear ALL match/league related items
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.includes('match') || key.includes('league') || 
              key.includes('cf_instant') || key.includes('cf_cache')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      console.log('✅ All caches cleared');
      console.log('✨ New match created:', data.match.id);
      
      // 📢 Dispatch multiple events to trigger UI updates
      if (typeof window !== 'undefined') {
        // Event 1: match-created (for match lists)
        window.dispatchEvent(new CustomEvent('match-created', { 
          detail: { match: data.match, leagueId: match.leagueId, timestamp: Date.now() } 
        }));
        
        // Event 2: cache-cleared (for cache manager)
        window.dispatchEvent(new CustomEvent('cache-cleared', {
          detail: { method: 'POST', url: '/matches', timestamp: Date.now() }
        }));
        
        // Event 3: league-updated (for league pages)
        window.dispatchEvent(new CustomEvent('league-updated', {
          detail: { leagueId: match.leagueId, timestamp: Date.now() }
        }));
        
        console.log('📢 Events dispatched: match-created, cache-cleared, league-updated');
      }
      
      return { success: true, data: data.match, message: 'Match created successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create match',
        error: error instanceof Error ? error.message : 'Failed to create match'
      };
    }
  },

  update: async (id: string, match: UpdateMatchDTO): Promise<ApiResponse<Match>> => {
    try {
      const data = await fetchAndCache<{ match: Match }>(`/matches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(match),
      });
      
      // 🗑️ Clear all match caches
      console.log('🗑️ Clearing match caches after update...');
      instantCache.forEach((_, key) => {
        if (key.includes('match') || key.includes('league')) {
          instantCache.delete(key);
        }
      });
      chunkedCache.forEach((_, key) => {
        if (key.includes('match') || key.includes('league')) {
          chunkedCache.delete(key);
        }
      });
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.includes('match') || key.includes('league')) {
            localStorage.removeItem(key);
          }
        });
        
        // 📢 Dispatch update event
        window.dispatchEvent(new CustomEvent('match-updated', { 
          detail: { match: data.match, matchId: id, timestamp: Date.now() } 
        }));
        console.log('📢 match-updated event dispatched');
      }
      
      return { success: true, data: data.match, message: 'Match updated successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update match',
        error: error instanceof Error ? error.message : 'Failed to update match'
      };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Match>> => {
    try {
      const data = await ultraFastFetch<{ match: Match }>(`/matches/${id}`, {}, `match_${id}`);
      return { success: true, data: data.match, message: 'Match fetched successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch match',
        error: error instanceof Error ? error.message : 'Failed to fetch match'
      };
    }
  },

  setAvailability: async (matchId: string, available: boolean): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    try {
      const action = available ? 'available' : 'unavailable';
      const data = await fetchAndCache<{ success: boolean; message: string }>(`/matches/${matchId}/availability?action=${action}`, {
        method: 'POST',
      });
      
      // Invalidate match caches
      instantCache.delete(`match_${matchId}`);
      instantCache.delete('matches_all');
      
      return { success: true, data, message: 'Availability updated successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update availability',
        error: error instanceof Error ? error.message : 'Failed to update availability'
      };
    }
  },

  delete: async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    try {
      const data = await fetchAndCache<{ success: boolean; message: string }>(`/matches/${id}`, { method: 'DELETE' });
      
      // 🗑️ Clear all match caches
      console.log('🗑️ Clearing all match caches after deletion...');
      instantCache.forEach((_, key) => {
        if (key.includes('match') || key.includes('league')) {
          instantCache.delete(key);
        }
      });
      chunkedCache.forEach((_, key) => {
        if (key.includes('match') || key.includes('league')) {
          chunkedCache.delete(key);
        }
      });
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.includes('match') || key.includes('league')) {
            localStorage.removeItem(key);
          }
        });
        
        // 📢 Dispatch deletion event
        window.dispatchEvent(new CustomEvent('match-deleted', { 
          detail: { matchId: id, timestamp: Date.now() } 
        }));
        console.log('📢 match-deleted event dispatched');
      }
      
      return { success: true, data, message: 'Match deleted successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete match',
        error: error instanceof Error ? error.message : 'Failed to delete match'
      };
    }
  }
};

// PLAYERS API - INSTANT CACHE + CHUNKED
export const playerAPI = {
  getAll: async (): Promise<PlayersResponse> => {
    const response = await ultraFastFetch<PlayersResponse>('/players', {}, 'players_all');
    
    // Save players in chunks
    if (response?.players && Array.isArray(response.players)) {
      setCacheChunked('players_chunked', response.players);
      console.log(`📦 Players cached in chunks: ${response.players.length} total`);
    }
    
    return response;
  },

  getAllChunked: function* (): Generator<User[], void, void> {
    const generator = getCacheChunkedGenerator<User>('players_chunked');
    for (const chunk of generator) {
      yield chunk;
    }
  },

  getStats: async (playerId: string): Promise<PlayerStatsResponse> => {
    return await ultraFastFetch<PlayerStatsResponse>(`/players/${playerId}/stats`, {}, `player_stats_${playerId}`);
  }
};

// LEADERBOARD API - INSTANT CACHE
export async function fetchLeaderboard(params: {
  metric?: string;
  leagueId?: string;
  positionType?: string;
}): Promise<LeaderboardResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) query.append(k, v);
  });
  
  const cacheKey = `leaderboard_${query.toString()}`;
  return await ultraFastFetch<LeaderboardResponse>(`/leaderboard?${query.toString()}`, {}, cacheKey);
}

// UTILITY FUNCTIONS
export function clearInstantCache(pattern?: string): void {
  if (pattern) {
    instantCache.forEach((_, key) => {
      if (key.includes(pattern)) {
        instantCache.delete(key);
      }
    });
    chunkedCache.forEach((_, key) => {
      if (key.includes(pattern)) {
        chunkedCache.delete(key);
      }
    });
  } else {
    instantCache.clear();
    chunkedCache.clear();
  }
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + '_chunked');
  }
  
  console.log(`🗑️ Cache cleared${pattern ? ` (pattern: ${pattern})` : ' (all)'}`);
}

export function getCacheStats() {
  return {
    size: instantCache.size,
    items: Array.from(instantCache.keys())
  };
}

// Export for backward compatibility
export { getCache, setCache } from './api-fast';
