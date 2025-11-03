// ULTRA FAST API WITH INSTANT CACHE - No delays on tab switching!
import { ApiResponse, LoginCredentials, RegisterCredentials, CreateLeagueDTO, CreateMatchDTO, UpdateMatchDTO } from '@/types/api';
import { User, League, Match } from '@/types/user';
import Cookies from 'js-cookie';
import type {
  LeaguesResponse,
  LeaderboardResponse,
  PlayersResponse,
  MatchesResponse,
  PlayerStatsResponse
} from '@/types/api';
import { optimizedFetch } from './httpClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Cache with instant retrieval
interface InstantCache<T> {
  data: T;
  expires: number;
  timestamp: number;
}

const instantCache = new Map<string, InstantCache<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'cf_instant_cache';

// Load cache from localStorage synchronously on init
if (typeof window !== 'undefined') {
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
  } catch (e) {
    console.error('Cache load error:', e);
  }
}

// Save cache to localStorage (throttled)
let saveTimeout: NodeJS.Timeout | null = null;
function saveCache() {
  if (typeof window === 'undefined') return;
  
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const cacheObj: Record<string, InstantCache<unknown>> = {};
      instantCache.forEach((value, key) => {
        if (Date.now() < value.expires) {
          cacheObj[key] = value;
        }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheObj));
    } catch (e) {
      console.error('Cache save error:', e);
    }
  }, 500);
}

// Get from cache instantly (synchronous)
function getCacheInstant<T>(key: string): T | null {
  const cached = instantCache.get(key);
  if (cached && Date.now() < cached.expires) {
    console.log(`⚡ INSTANT HIT: ${key} (${Date.now() - cached.timestamp}ms old)`);
    return cached.data as T;
  }
  return null;
}

// Set cache
function setCacheInstant<T>(key: string, data: T, ttl: number = CACHE_TTL) {
  instantCache.set(key, {
    data,
    expires: Date.now() + ttl,
    timestamp: Date.now()
  });
  saveCache();
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
  const token = Cookies.get('token') || Cookies.get('auth_token');
  
  const response = await optimizedFetch(API_BASE_URL + endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }
  
  const data = await response.json();
  
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
      const data = await ultraFastFetch<{ user: User }>('/auth/data', {}, 'user_data');
      return {
        success: true,
        data: data.user,
        message: 'User data fetched'
      };
    } catch (error) {
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
      
      // Clear all caches
      instantCache.clear();
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
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

// LEAGUES API - INSTANT CACHE
export const leagueAPI = {
  /**
   * Get all leagues - instantly from cache if available
   * Returns cached data immediately (0ms), updates in background
   */
  getAll: async (): Promise<LeaguesResponse> => {
    return await ultraFastFetch<LeaguesResponse>('/leagues', {}, 'leagues_all');
  },

  /**
   * Get all leagues INSTANTLY (synchronous)
   * Returns cached leagues array immediately without waiting
   */
  getAllInstant: (): League[] => {
    const cached = getCacheInstant<LeaguesResponse>('leagues_all');
    return (cached?.leagues || []) as League[];
  },

  /**
   * Invalidate leagues cache
   * Call this after creating/updating/deleting a league
   */
  invalidateCache: () => {
    instantCache.delete('leagues_all');
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

// MATCHES API - INSTANT CACHE
export const matchAPI = {
  getAll: async (): Promise<MatchesResponse> => {
    return await ultraFastFetch<MatchesResponse>('/matches', {}, 'matches_all');
  },

  getByLeague: async (leagueId: string): Promise<MatchesResponse> => {
    return await ultraFastFetch<MatchesResponse>(`/matches?leagueId=${leagueId}`, {}, `matches_league_${leagueId}`);
  },

  create: async (match: CreateMatchDTO): Promise<ApiResponse<Match>> => {
    try {
      const data = await fetchAndCache<{ match: Match }>('/matches', {
        method: 'POST',
        body: JSON.stringify(match),
      });
      
      // Invalidate ALL match caches
      instantCache.delete('matches_all');
      instantCache.delete(`matches_league_${match.leagueId}`);
      
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
      
      // Invalidate match caches
      instantCache.forEach((_, key) => {
        if (key.includes('match')) {
          instantCache.delete(key);
        }
      });
      
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
      
      // Clear all match caches
      instantCache.forEach((_, key) => {
        if (key.includes('match')) {
          instantCache.delete(key);
        }
      });
      
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

// PLAYERS API - INSTANT CACHE
export const playerAPI = {
  getAll: async (): Promise<PlayersResponse> => {
    return await ultraFastFetch<PlayersResponse>('/players', {}, 'players_all');
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
  } else {
    instantCache.clear();
  }
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
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
