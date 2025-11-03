// API CLIENT WITH CHUNK-BASED CACHING & REAL-TIME UPDATES
import {
  fetchWithChunks,
  updateCachedItem,
  addCachedItem,
  removeCachedItem,
  invalidateCache,
  subscribeToCacheUpdates,
  getCacheStats,
} from './chunkCache';
import { optimizedFetch } from './httpClient';
import Cookies from 'js-cookie';
import type {
  ApiResponse,
  LoginCredentials,
  RegisterCredentials,
  CreateLeagueDTO,
  CreateMatchDTO,
  UpdateMatchDTO,
  LeaguesResponse,
  LeaderboardResponse,
  PlayersResponse,
  MatchesResponse,
  PlayerStatsResponse,
  LeagueApi,
  LeagueMember,
  MatchApi,
} from '@/types/api';
import type { User, League, Match } from '@/types/user';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper to normalize profilePicture (remove null)
function normalizeProfilePicture(pic: string | null | undefined): string | undefined {
  return pic === null ? undefined : pic;
}

// Helper to convert User to LeagueMember
function toLeagueMember(user: User): LeagueMember {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    position: user.position,
    positionType: user.positionType,
    profilePicture: normalizeProfilePicture(user.profilePicture),
  };
}

// Helper to convert League to LeagueApi
function toLeagueApi(league: League): LeagueApi {
  return {
    id: league.id,
    name: league.name,
    description: league.description,
    members: league.members?.map(toLeagueMember),
    administeredLeagues: league.administrators?.map(toLeagueMember),
    matches: league.matches?.map((match) => ({
      id: match.id,
      date: match.date,
      homeTeamGoals: match.homeTeamGoals,
      awayTeamGoals: match.awayTeamGoals,
      homeTeamUsers: match.homeTeamUsers?.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        profilePicture: normalizeProfilePicture(u.profilePicture),
      })),
      awayTeamUsers: match.awayTeamUsers?.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        profilePicture: normalizeProfilePicture(u.profilePicture),
      })),
    })),
  };
}

// Helper to convert Match to MatchApi
function toMatchApi(match: Match): MatchApi {
  return {
    id: match.id,
    date: match.date,
    homeTeamGoals: match.homeTeamGoals,
    awayTeamGoals: match.awayTeamGoals,
    homeTeamUsers: match.homeTeamUsers?.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      profilePicture: normalizeProfilePicture(u.profilePicture),
    })),
    awayTeamUsers: match.awayTeamUsers?.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      profilePicture: normalizeProfilePicture(u.profilePicture),
    })),
  };
}

// Helper to make API calls with proper error handling
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
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
    const text = await response.text();
    throw new Error(`API Error ${response.status}: ${text}`);
  }

  return response.json();
}

// AUTH API
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

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<User>> => {
    try {
      const data = await apiCall<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ user: credentials }),
      });

      return {
        success: true,
        data: data.user,
        token: data.token,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  },

  register: async (credentials: RegisterCredentials): Promise<ApiResponse<User>> => {
    try {
      const data = await apiCall<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ user: credentials }),
      });

      return {
        success: true,
        data: data.user,
        token: data.token,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Registration failed',
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  },

  getUserData: async (): Promise<ApiResponse<User>> => {
    try {
      const data = await apiCall<UserDataResponse>('/auth/data');
      return {
        success: true,
        data: data.user,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch user data',
        error: error instanceof Error ? error.message : 'Failed to fetch user data',
      };
    }
  },

  logout: async (): Promise<ApiResponse<null>> => {
    try {
      await apiCall<LogoutResponse>('/auth/logout', { method: 'POST' });
      Cookies.remove('token');
      Cookies.remove('auth_token');
      
      // Clear all caches
      invalidateCache();
      
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Logout failed',
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  },
};

// LEAGUES API WITH CHUNK CACHING
export const leagueAPI = {
  // Get leagues with pagination and caching
  getAll: async (page: number = 0, limit: number = 20): Promise<LeaguesResponse> => {
    try {
      const leagues = await fetchWithChunks<League>('leagues', '/leagues', {
        page,
        limit,
      });

      return {
        success: true,
        leagues: leagues.map(toLeagueApi),
      };
    } catch (error) {
      console.error('Failed to fetch leagues:', error);
      return {
        success: false,
        leagues: [],
      };
    }
  },

  // Create league with real-time cache update
  create: async (league: CreateLeagueDTO): Promise<ApiResponse<League>> => {
    try {
      const data = await apiCall<{ league: League }>('/leagues', {
        method: 'POST',
        body: JSON.stringify(league),
      });

      // Add to cache immediately (optimistic update)
      addCachedItem('leagues', data.league);

      // Dispatch event for real-time updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('league-created', {
            detail: { league: data.league },
          })
        );
      }

      return {
        success: true,
        data: data.league,
        message: 'League created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create league',
        error: error instanceof Error ? error.message : 'Failed to create league',
      };
    }
  },

  // Get single league
  getById: async (id: string): Promise<ApiResponse<League>> => {
    try {
      const data = await apiCall<{ league: League }>(`/leagues/${id}`);
      
      // Update cache
      updateCachedItem('leagues', data.league);

      return {
        success: true,
        data: data.league,
        message: 'League fetched successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch league',
        error: error instanceof Error ? error.message : 'Failed to fetch league',
      };
    }
  },

  // Join league with cache update
  join: async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    try {
      const data = await apiCall<{ success: boolean; message: string; league?: League }>(
        `/leagues/${id}/join`,
        { method: 'POST' }
      );

      // If league data is returned, update cache
      if (data.league) {
        updateCachedItem('leagues', data.league);
      } else {
        // Otherwise, invalidate to force refresh
        invalidateCache('leagues');
      }

      // Dispatch event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('league-joined', {
            detail: { leagueId: id },
          })
        );
      }

      return {
        success: true,
        data,
        message: 'Joined league successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to join league',
        error: error instanceof Error ? error.message : 'Failed to join league',
      };
    }
  },

  // Join with code
  joinWithCode: async (inviteCode: string): Promise<ApiResponse<League>> => {
    try {
      const data = await apiCall<{ league: League }>('/leagues/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode }),
      });

      // Add to cache
      addCachedItem('leagues', data.league);

      // Dispatch event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('league-joined', {
            detail: { league: data.league },
          })
        );
      }

      return {
        success: true,
        data: data.league,
        message: 'Joined league successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to join league with code',
        error: error instanceof Error ? error.message : 'Failed to join league',
      };
    }
  },

  // Leave league
  leave: async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    try {
      const data = await apiCall<{ success: boolean; message: string }>(
        `/leagues/${id}/leave`,
        { method: 'POST' }
      );

      // Remove from cache
      removeCachedItem('leagues', id);

      // Dispatch event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('league-left', {
            detail: { leagueId: id },
          })
        );
      }

      return {
        success: true,
        data,
        message: 'Left league successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to leave league',
        error: error instanceof Error ? error.message : 'Failed to leave league',
      };
    }
  },

  // Delete league
  delete: async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    try {
      const data = await apiCall<{ success: boolean; message: string }>(
        `/leagues/${id}`,
        { method: 'DELETE' }
      );

      // Remove from cache
      removeCachedItem('leagues', id);
      
      // Also invalidate related matches
      invalidateCache(`matches_league_${id}`);

      // Dispatch event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('league-deleted', {
            detail: { leagueId: id },
          })
        );
      }

      return {
        success: true,
        data,
        message: 'League deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete league',
        error: error instanceof Error ? error.message : 'Failed to delete league',
      };
    }
  },

  // Subscribe to league updates
  subscribeToUpdates: (callback: (league: League) => void) => {
    return subscribeToCacheUpdates<League>('leagues', callback);
  },
};

// MATCHES API WITH CHUNK CACHING
export const matchAPI = {
  // Get all matches
  getAll: async (page: number = 0, limit: number = 20): Promise<MatchesResponse> => {
    try {
      const matches = await fetchWithChunks<Match>('matches', '/matches', {
        page,
        limit,
      });

      return {
        success: true,
        matches: matches.map(toMatchApi),
      };
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      return {
        success: false,
        matches: [],
      };
    }
  },

  // Get matches by league
  getByLeague: async (leagueId: string, page: number = 0, limit: number = 20): Promise<MatchesResponse> => {
    try {
      const matches = await fetchWithChunks<Match>(
        `matches_league_${leagueId}`,
        `/matches?leagueId=${leagueId}`,
        { page, limit }
      );

      return {
        success: true,
        matches: matches.map(toMatchApi),
      };
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      return {
        success: false,
        matches: [],
      };
    }
  },

  // Create match with real-time update
  create: async (match: CreateMatchDTO): Promise<ApiResponse<Match>> => {
    try {
      const data = await apiCall<{ match: Match }>('/matches', {
        method: 'POST',
        body: JSON.stringify(match),
      });

      // Add to cache immediately
      addCachedItem('matches', data.match);
      addCachedItem(`matches_league_${match.leagueId}`, data.match);

      // Dispatch event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('match-created', {
            detail: { match: data.match, leagueId: match.leagueId },
          })
        );
      }

      return {
        success: true,
        data: data.match,
        message: 'Match created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create match',
        error: error instanceof Error ? error.message : 'Failed to create match',
      };
    }
  },

  // Update match
  update: async (id: string, match: UpdateMatchDTO): Promise<ApiResponse<Match>> => {
    try {
      const data = await apiCall<{ match: Match }>(`/matches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(match),
      });

      // Update in cache
      updateCachedItem('matches', data.match);
      // Note: Match type doesn't have leagueId, so we can't update league-specific cache here

      // Dispatch event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('match-updated', {
            detail: { match: data.match, matchId: id },
          })
        );
      }

      return {
        success: true,
        data: data.match,
        message: 'Match updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update match',
        error: error instanceof Error ? error.message : 'Failed to update match',
      };
    }
  },

  // Get single match
  getById: async (id: string): Promise<ApiResponse<Match>> => {
    try {
      const data = await apiCall<{ match: Match }>(`/matches/${id}`);
      
      // Update cache
      updateCachedItem('matches', data.match);

      return {
        success: true,
        data: data.match,
        message: 'Match fetched successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch match',
        error: error instanceof Error ? error.message : 'Failed to fetch match',
      };
    }
  },

  // Set availability with real-time update
  setAvailability: async (matchId: string, available: boolean): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    try {
      const action = available ? 'available' : 'unavailable';
      const data = await apiCall<{ success: boolean; message: string; match?: Match }>(
        `/matches/${matchId}/availability?action=${action}`,
        { method: 'POST' }
      );

      // If match data is returned, update cache
      if (data.match) {
        updateCachedItem('matches', data.match);
        // Note: Match type doesn't have leagueId, so we can't update league-specific cache here
      }

      // Dispatch event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('match-updated', {
            detail: { matchId, available },
          })
        );
      }

      return {
        success: true,
        data,
        message: 'Availability updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update availability',
        error: error instanceof Error ? error.message : 'Failed to update availability',
      };
    }
  },

  // Delete match
  delete: async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    try {
      const data = await apiCall<{ success: boolean; message: string }>(
        `/matches/${id}`,
        { method: 'DELETE' }
      );

      // Remove from cache
      removeCachedItem('matches', id);

      // Dispatch event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('match-deleted', {
            detail: { matchId: id },
          })
        );
      }

      return {
        success: true,
        data,
        message: 'Match deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete match',
        error: error instanceof Error ? error.message : 'Failed to delete match',
      };
    }
  },

  // Subscribe to match updates
  subscribeToUpdates: (callback: (match: Match) => void) => {
    return subscribeToCacheUpdates<Match>('matches', callback);
  },
};

// PLAYERS API WITH CACHING
export const playerAPI = {
  getAll: async (page: number = 0, limit: number = 20): Promise<PlayersResponse> => {
    try {
      const players = await fetchWithChunks('players', '/players', {
        page,
        limit,
      });

      return {
        success: true,
        players: players as PlayersResponse['players'],
      };
    } catch (error) {
      console.error('Failed to fetch players:', error);
      return {
        success: false,
        players: [],
      };
    }
  },

  getStats: async (playerId: string): Promise<PlayerStatsResponse> => {
    try {
      const data = await apiCall<PlayerStatsResponse>(`/players/${playerId}/stats`);
      return data;
    } catch (error) {
      console.error('Failed to fetch player stats:', error);
      throw error;
    }
  },
};

// LEADERBOARD API
export async function fetchLeaderboard(params: {
  metric?: string;
  leagueId?: string;
  positionType?: string;
}): Promise<LeaderboardResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) query.append(k, v);
  });

  return apiCall<LeaderboardResponse>(`/leaderboard?${query.toString()}`);
}

// UTILITY FUNCTIONS
export { getCacheStats, invalidateCache, subscribeToCacheUpdates };

// Export event types for TypeScript
export type CacheEvent =
  | { type: 'league-created'; league: League }
  | { type: 'league-updated'; league: League }
  | { type: 'league-joined'; leagueId: string }
  | { type: 'league-left'; leagueId: string }
  | { type: 'league-deleted'; leagueId: string }
  | { type: 'match-created'; match: Match; leagueId: string }
  | { type: 'match-updated'; match: Match; matchId: string }
  | { type: 'match-deleted'; matchId: string };
