import { ApiResponse, LoginCredentials, RegisterCredentials, CreateLeagueDTO, CreateMatchDTO, UpdateMatchDTO } from '@/types/api';
import { User, League, Match } from '@/types/user';
import Cookies from 'js-cookie';
import type {
  LeaguesResponse,
  LeaderboardResponse,
  PlayersResponse,
  MatchesResponse,
  DreamTeamResponse,
  PlayerStatsResponse,
  CacheEntry
} from '../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Player {
  id: string;
  name: string;
  profilePicture: string | null;
  rating: number;
}

// Auth API Functions
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<User>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: credentials }),
        credentials: 'include'
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.user,
        token: data.token,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  },

  register: async (credentials: RegisterCredentials): Promise<ApiResponse<User>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.user,
        token: data.token,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  },

  resetPassword: async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ user: { email } }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Password reset failed');
      }

      return { success: true };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An error occurred during password reset' };
    }    
  },

  getUserData: async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/data`, {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get user data');
      }

      return { success: true, user: data.user };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An error occurred while fetching user data' };
    }    
  },

  logout: async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      // Return success response
      return { 
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Logout failed' };
    }    
  },

  checkAuth: async (): Promise<ApiResponse<User>> => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        return {
          success: false,
          error: 'No token found'
        };
      }

      const response = await fetch(`${API_BASE_URL}/auth/data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.user,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication check failed'
      };
    }
  },
};

// Leagues API Functions
export const leagueAPI = {
  getLeagues: async (): Promise<ApiResponse<League[]>> => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${API_BASE_URL}/leagues`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.leagues,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch leagues'
      };
    }
  },

  createLeague: async (token: string, leagueData: CreateLeagueDTO) => {
    const response = await fetch(`${API_BASE_URL}/leagues`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(leagueData),
    });
    return response.json();
  },

  joinLeague: async (token: string, inviteCode: string) => {
    const response = await fetch(`${API_BASE_URL}/leagues/join`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ inviteCode }),
    });
    return response.json();
  },
};

// Matches API Functions
export const matchAPI = {
  getMatches: async (): Promise<ApiResponse<Match[]>> => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${API_BASE_URL}/matches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Server returned ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.matches,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch matches'
      };
    }
  },

  createMatch: async (token: string, matchData: CreateMatchDTO) => {
    const response = await fetch(`${API_BASE_URL}/matches`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(matchData),
    });
    return response.json();
  },

  updateMatch: async (token: string, matchId: string, matchData: UpdateMatchDTO) => {
    const response = await fetch(`${API_BASE_URL}/matches/${matchId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(matchData),
    });
    return response.json();
  },

  getLeagues: async (): Promise<ApiResponse<League[]>> => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${API_BASE_URL}/profile/leagues`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.leagues,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch leagues'
      };
    }
  },

  // getMatches: async (): Promise<ApiResponse<Match[]>> => {
  //   try {
  //     const token = Cookies.get('token');
  //     const response = await fetch(`${API_BASE_URL}/profile/matches`, {
  //       headers: {
  //         'Authorization': `Bearer ${token}`
  //       }
  //     });

  //     const data = await response.json();
  //     return {
  //       success: response.ok,
  //       data: data.matches,
  //       error: data.error
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       error: error instanceof Error ? error.message : 'Failed to fetch matches'
  //     };
  //   }
  // },

  updateProfilePicture: async (imageFile: File): Promise<ApiResponse<User>> => {
    try {
      const token = Cookies.get('token');
      const formData = new FormData();
      formData.append('profilePicture', imageFile);

      const response = await fetch(`${API_BASE_URL}/profile/picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.user,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile picture'
      };
    }
  }
};

// Users API Functions
export const usersAPI = {
  getUserProfile: async (token: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return response.json();
  },

  updateUserProfile: async (token: string, userId: string, userData: Partial<User>) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },
};

type Statistics = {
  matchesPlayed: number;
  goalsScored: number;
  assists: number;
  wins: number;
  losses: number;
  draws: number;
};

// Profile API Functions
export const profileAPI = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.user,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile'
      };
    }
  },

  updateProfile: async (userData: {
    name?: string;
    position?: string;
    style?: string;
    preferredFoot?: string;
    shirtNumber?: string;
    skills?: {
      dribbling: number;
      shooting: number;
      passing: number;
      pace: number;
      defending: number;
      physical: number;
    };
  }): Promise<ApiResponse<User>> => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.user,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile'
      };
    }
  },

  updateSkills: async (skills: {
    dribbling: number;
    shooting: number;
    passing: number;
    pace: number;
    defending: number;
    physical: number;
  }): Promise<ApiResponse<User>> => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${API_BASE_URL}/profile/skills`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skills })
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.user,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update skills'
      };
    }
  },

  getStatistics: async (): Promise<ApiResponse<Statistics>> => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${API_BASE_URL}/profile/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.statistics,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch statistics'
      };
    }
  },

  getLeagues: async (): Promise<ApiResponse<League[]>> => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${API_BASE_URL}/profile/leagues`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.leagues,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch leagues'
      };
    }
  },

  getMatches: async (): Promise<ApiResponse<Match[]>> => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${API_BASE_URL}/profile/matches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.matches,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch matches'
      };
    }
  },

  updateProfilePicture: async (imageFile: File): Promise<ApiResponse<User>> => {
    try {
      const token = Cookies.get('token');
      const formData = new FormData();
      formData.append('profilePicture', imageFile);

      const response = await fetch(`${API_BASE_URL}/profile/picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.user,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile picture'
      };
    }
  }
};

interface SkillSet {
  dribbling: number;
  shooting: number;
  passing: number;
  pace: number;
  defending: number;
  physical: number;
}

interface UpdateProfileData {
  firstName: string;
  lastName: string;
  email: string;
  age?: number;
  gender: string;
  position: string;
  positionType: string;
  style: string;
  preferredFoot: string;
  password?: string;
  shirtNumber: string;
  skills: SkillSet;
}

export const updateProfile = async ( token: string , updateData: UpdateProfileData) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  
  // Debug logging
  console.log('🔍 updateProfile called with data:', updateData);
  console.log('🔍 positionType value:', updateData.positionType);
  console.log('🔍 Full updateData object:', JSON.stringify(updateData, null, 2));
  
  const response = await fetch(`${apiUrl}/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });
  let data;
  try {
    data = await response.json();
    console.log('🔍 Backend response:', data);
  } catch {
    data = { message: 'Invalid server response' };
  }
  return { ok: response.ok, data };
};

export async function deleteProfile(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return res.ok;
}

interface PlayerStatsData {
  player: PlayerDetails;
  leagues: LeagueInfo[];
  years: number[];
  currentStats: Record<string, number>;
  accumulativeStats: Record<string, number>;
  trophies: Record<string, number>;
}
interface LeagueInfo {
  id: string;
  name: string;
}
interface PlayerDetails {
  name: string;
  position: string;
  rating: number;
  avatar: string | null;
  profilePicture: string | null;
}
export const playerAPI = {
  getPlayedWith: async (token: string): Promise<ApiResponse<Player[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/players/played-with`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to fetch players' };
      }

      const data = await response.json();
      return { success: true, data: data.players };

    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  },

  getPlayerStats: async (playerId: string, leagueId: string, year: string): Promise<ApiResponse<PlayerStatsData>> => {
    try {
        const token = Cookies.get('token');
        const response = await fetch(`${API_BASE_URL}/players/${playerId}/stats?leagueId=${leagueId}&year=${year}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, error: errorData.message || 'Failed to fetch player stats' };
        }

        const data = await response.json();
        return { success: true, data: data.data };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  },
}

// --- LocalStorage Cache Utility ---
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  // 1. Try localStorage
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      const { data, expiry } = JSON.parse(cached) as CacheEntry<T>;
      if (Date.now() < expiry) return data;
    } catch {}
  }
  // 2. Try cookies
  const cookie = Cookies.get(key);
  if (cookie) {
    try {
      const { data, expiry } = JSON.parse(cookie) as CacheEntry<T>;
      if (Date.now() < expiry) {
        // Restore to localStorage for next time
        localStorage.setItem(key, cookie);
        return data;
      }
    } catch {}
  }
  return null;
}
function setCache<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  const value = JSON.stringify({ data, expiry: Date.now() + CACHE_TTL });
  localStorage.setItem(key, value);
  Cookies.set(key, value, { expires: 1/144 }); // ~10 min
}

// --- API Wrappers with Local Cache ---
export async function fetchLeaguesWithCache(token: string): Promise<LeaguesResponse> {
  const key = 'leagues_cache';
  const cached = getCache<LeaguesResponse>(key);
  if (cached) return cached;
  const res = await fetch(`/api/leagues/user`, { headers: { Authorization: `Bearer ${token}` } });
  const data: LeaguesResponse = await res.json();
  setCache(key, data);
  return data;
}

export async function fetchLeaderboardWithCache(token: string): Promise<LeaderboardResponse> {
  const key = 'leaderboard_cache';
  const cached = getCache<LeaderboardResponse>(key);
  if (cached) return cached;
  const res = await fetch(`/api/leaderboard`, { headers: { Authorization: `Bearer ${token}` } });
  const data: LeaderboardResponse = await res.json();
  setCache(key, data);
  return data;
}

export async function fetchPlayersWithCache(token: string): Promise<PlayersResponse> {
  const key = 'players_cache';
  const cached = getCache<PlayersResponse>(key);
  if (cached) return cached;
  const res = await fetch(`/api/players`, { headers: { Authorization: `Bearer ${token}` } });
  const data: PlayersResponse = await res.json();
  setCache(key, data);
  return data;
}

export async function fetchMatchesWithCache(token: string): Promise<MatchesResponse> {
  const key = 'matches_cache';
  const cached = getCache<MatchesResponse>(key);
  if (cached) return cached;
  const res = await fetch(`/api/matches`, { headers: { Authorization: `Bearer ${token}` } });
  const data: MatchesResponse = await res.json();
  setCache(key, data);
  return data;
}

export async function fetchDreamTeamWithCache(token: string): Promise<DreamTeamResponse> {
  const key = 'dreamteam_cache';
  const cached = getCache<DreamTeamResponse>(key);
  if (cached) return cached;
  const res = await fetch(`/api/dreamTeam`, { headers: { Authorization: `Bearer ${token}` } });
  const data: DreamTeamResponse = await res.json();
  setCache(key, data);
  return data;
}

export async function fetchPlayerStatsWithCache(playerId: string, token: string): Promise<PlayerStatsResponse> {
  const key = `playerstats_cache_${playerId}`;
  const cached = getCache<PlayerStatsResponse>(key);
  if (cached) return cached;
  const res = await fetch(`/api/players/${playerId}/stats`, { headers: { Authorization: `Bearer ${token}` } });
  const data: PlayerStatsResponse = await res.json();
  setCache(key, data);
  return data;
}