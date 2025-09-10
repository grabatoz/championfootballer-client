// ULTRA FAST API CLIENT - Cleaned and Optimized
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Cache item interface
interface CacheItem<T> {
  data: T;
  expires: number;
}

// LIGHTNING FAST CACHE
const fastCache = new Map<string, CacheItem<unknown>>();

function getCache<T>(key: string): T | null {
  const cached = fastCache.get(key);
  if (cached && Date.now() < cached.expires) return cached.data as T;
  fastCache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T, minutes: number = 15): void {
  fastCache.set(key, { data, expires: Date.now() + (minutes * 60 * 1000) } as CacheItem<T>);
}

// ULTRA FAST FETCH
async function quickFetch<T>(endpoint: string, options: RequestInit = {}, cacheKey?: string): Promise<T> {
  if (cacheKey && (!options.method || options.method === 'GET')) {
    const cached = getCache<T>(cacheKey);
    if (cached) return cached;
  }

  const token = Cookies.get('token');
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include'
  });

  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  const data = await response.json();
  
  if (cacheKey && (!options.method || options.method === 'GET')) {
    setCache(cacheKey, data, 15); // 15 min cache
  }
  
  return data;
}

// Auth response interfaces
interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

interface UserDataResponse {
  user: User;
  message: string;
}

interface LogoutResponse {
  message: string;
}

// AUTH API - OPTIMIZED
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<User>> => {
    try {
      const data = await quickFetch<AuthResponse>('/auth/login', {
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
      const data = await quickFetch<AuthResponse>('/auth/register', {
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
      const data = await quickFetch<UserDataResponse>('/auth/data', {}, 'user_data');
      return {
        success: true,
        data: data.user,
        message: data.message
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
      await quickFetch<LogoutResponse>('/auth/logout', { method: 'POST' });
      Cookies.remove('token');
      fastCache.clear(); // Clear all cache on logout
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

// LEAGUES API - ULTRA FAST
export const leagueAPI = {
  getAll: async (): Promise<LeaguesResponse> => {
    return await quickFetch<LeaguesResponse>('/leagues', {}, 'leagues_all');
  },

  create: async (league: CreateLeagueDTO): Promise<ApiResponse<League>> => {
    try {
      const data = await quickFetch<{ league: League }>('/leagues', {
        method: 'POST',
        body: JSON.stringify(league),
      });
      
      fastCache.delete('leagues_all'); // Invalidate cache
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
      const data = await quickFetch<{ league: League }>(`/leagues/${id}`, {}, `league_${id}`);
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
      const data = await quickFetch<{ success: boolean; message: string }>(`/leagues/${id}/join`, { method: 'POST' });
      fastCache.delete('leagues_all'); // Invalidate cache
      fastCache.delete(`league_${id}`);
      return { success: true, data, message: 'Joined league successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to join league',
        error: error instanceof Error ? error.message : 'Failed to join league'
      };
    }
  }
};

// MATCHES API - OPTIMIZED
export const matchAPI = {
  getAll: async (): Promise<MatchesResponse> => {
    return await quickFetch<MatchesResponse>('/matches', {}, 'matches_all');
  },

  getByLeague: async (leagueId: string): Promise<MatchesResponse> => {
    return await quickFetch<MatchesResponse>(`/matches?leagueId=${leagueId}`, {}, `matches_league_${leagueId}`);
  },

  create: async (match: CreateMatchDTO): Promise<ApiResponse<Match>> => {
    try {
      const data = await quickFetch<{ match: Match }>('/matches', {
        method: 'POST',
        body: JSON.stringify(match),
      });
      
      // Invalidate relevant caches
      fastCache.delete('matches_all');
      fastCache.delete(`matches_league_${match.leagueId}`);
      
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
      const data = await quickFetch<{ match: Match }>(`/matches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(match),
      });
      
      // Invalidate relevant caches
      fastCache.delete('matches_all');
      fastCache.delete(`match_${id}`);
      
      return { success: true, data: data.match, message: 'Match updated successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update match',
        error: error instanceof Error ? error.message : 'Failed to update match'
      };
    }
  }
};

// PLAYERS API - FAST
export const playerAPI = {
  getAll: async (): Promise<PlayersResponse> => {
    return await quickFetch<PlayersResponse>('/players', {}, 'players_all');
  },

  getStats: async (playerId: string): Promise<PlayerStatsResponse> => {
    return await quickFetch<PlayerStatsResponse>(`/players/${playerId}/stats`, {}, `player_stats_${playerId}`);
  }
};

// LEADERBOARD API - CACHED
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
  return await quickFetch<LeaderboardResponse>(`/leaderboard?${query.toString()}`, {}, cacheKey);
}

// WORLD RANKING API - ULTRA FAST CACHED
export interface WorldRankingPlayer {
  id: string;
  name: string;
  position: string;
  positionType: string;
  profilePicture: string;
  totalXP: number;
  avgXP: number;
  matches: number;
  rank: number;
}

export interface WorldRankingResponse {
  players: WorldRankingPlayer[];
  mode: 'avg' | 'total';
  limit: number;
  playerOutsideTop?: boolean;
  playerRank?: number;
}

export async function fetchWorldRanking(params: {
  mode?: 'avg' | 'total';
  playerId?: string;
  positionType?: string;
  year?: number;
  limit?: number;
//   token?: string;
}): Promise<WorldRankingResponse> {
  const {...rest } = params || {};
  // Note: token is extracted but not used in this implementation
  const search = new URLSearchParams();
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined && v !== null) search.append(k, String(v));
  });

  const cacheKey = `world_ranking_${search.toString()}`;
  return await quickFetch<WorldRankingResponse>(`/world-ranking?${search.toString()}`, {}, cacheKey);
}

// UTILITY FUNCTIONS
export function clearCache(pattern?: string): void {
  if (pattern) {
    for (const [key] of fastCache) {
      if (key.includes(pattern)) {
        fastCache.delete(key);
      }
    }
  } else {
    fastCache.clear();
  }
}

export function getCacheStatus(): Record<string, boolean> {
  const status: Record<string, boolean> = {};
  for (const [key] of fastCache) {
    status[key] = true;
  }
  return status;
}

// Export main functions for backward compatibility
export { getCache, setCache };
