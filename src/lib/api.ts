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
  CacheEntry,
  MatchUser
} from '@/types/api';
import { saveAuthSession, decodeJwt } from './auth';
import { getAuthToken } from './tokenManager';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Token refresh handler - checks for new token in response headers
function handleTokenRefresh(response: Response): void {
  const newToken = response.headers.get('X-New-Token');
  const wasRefreshed = response.headers.get('X-Token-Refreshed');
  
  if (newToken && wasRefreshed === 'true') {
    console.log('🔄 Token auto-refreshed by server');
    
    // Decode new token to get expiry
    const decoded = decodeJwt(newToken);
    
    // Update localStorage and cookies
    const existingUser = localStorage.getItem('user');
    if (existingUser) {
      try {
        const user = JSON.parse(existingUser);
        saveAuthSession(newToken, user, decoded.exp);
        Cookies.set('token', newToken, { expires: 7 });
        console.log('✅ New token saved automatically');
      } catch (error) {
        console.error('❌ Failed to save refreshed token:', error);
      }
    }
  }
}

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
        error: data.error,
        message: data.message,
        requiresVerification: data.requiresVerification,
        email: data.email,
      } as ApiResponse<User>;
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
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
        error: data.error,
        message: data.message,
        requiresVerification: data.requiresVerification,
        email: data.email,
      } as ApiResponse<User>;
    } catch (error) {
      return {
        success: false,
         message: 'Registration failed', 
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  },

  verifyRegistration: async (email: string, code: string): Promise<ApiResponse<User>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, code }),
        credentials: 'include'
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.user,
        token: data.token,
        error: data.error || data.message,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
        message: 'Verification failed',
      };
    }
  },

  resendVerification: async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend code');
      }
      return { success: true, message: data.message || 'Verification code sent!' };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to resend verification code' };
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

  verifyResetCode: async (email: string, code: string, newPassword: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      return { success: true, message: data.message || 'Password reset successfully!' };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An error occurred during verification' };
    }
  },

  verifyOtp: async (email: string, code: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      return { success: true, message: data.message || 'Code verified!' };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An error occurred during OTP verification' };
    }
  },

  getUserData: async (token: string) => {
    try {
      // Validate token before sending
      if (!token || token === 'undefined' || token === 'null') {
        console.error('❌ Invalid token provided to getUserData:', token);
        return { success: false, error: 'Invalid token' };
      }

      console.log('📤 Sending getUserData request with token:', {
        tokenLength: token.length,
        tokenParts: token.split('.').length,
        tokenStart: token.substring(0, 10)
      });

      const response = await fetch(`${API_BASE_URL}/auth/data`, {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
      });

      // Check for token refresh
      handleTokenRefresh(response);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get user data');
      }

      return { success: true, user: data.user };
    } catch (error: unknown) {
      console.error('❌ getUserData error:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An error occurred while fetching user data' };
    }    
  },

  logout: async (token?: string | null) => {
    try {
      let headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (typeof token === 'string' && token && token !== 'undefined' && token !== 'null') {
        headers = {
          ...headers,
          'Authorization': `Bearer ${token}`,
        };
      }

      let response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      // Backward compatibility for older servers that only support GET.
      if (!response.ok && (response.status === 404 || response.status === 405)) {
        response = await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'GET',
          headers,
          credentials: 'include',
        });
      }

      if (!response.ok) {
        let message = 'Failed to logout';
        try {
          const data = await response.json();
          if (typeof data?.message === 'string' && data.message.trim()) {
            message = data.message;
          }
        } catch { }
        throw new Error(message);
      }

      return {
        success: true,
        message: 'Logged out successfully',
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
      const token = getAuthToken();
      
      console.log('🔍 checkAuth called:', {
        hasToken: !!token,
        tokenLength: token?.length,
        cookieString: document.cookie.substring(0, 100)
      });

      if (!token || token === 'undefined' || token === 'null') {
        console.error('❌ No valid token found in cookies');
        return {
          success: false,
          message:'No token found',
          error: 'No token found'
        };
      }

      console.log('📤 Sending checkAuth request with token');

      const response = await fetch(`${API_BASE_URL}/auth/data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      // Check for token refresh
      handleTokenRefresh(response);

      const data = await response.json();
      
      console.log('📥 checkAuth response:', {
        status: response.status,
        ok: response.ok,
        hasUser: !!data.user
      });

      return {
        success: response.ok,
        data: data.user,
        error: data.error,
        message:data.message
      };
    } catch (error) {
      console.error('❌ checkAuth error:', error);
      return {
        success: false,
        message:'Authentication check failed',
        error: error instanceof Error ? error.message : 'Authentication check failed'
      };
    }
  },
};

// Leagues API Functions
export const leagueAPI = {
  getLeagues: async (): Promise<ApiResponse<League[]>> => {
    try {
      const token = getAuthToken(); // Use TokenManager
      
      if (!token) {
        console.error('❌ getLeagues: No valid token found');
        return {
          success: false,
          message: 'No authentication token',
          error: 'No authentication token'
        };
      }

      console.log('📤 Fetching leagues with token');
      const response = await fetch(`${API_BASE_URL}/leagues`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.leagues,
        error: data.error,
        message:data.message
      };
    } catch (error) {
      return {
        success: false,
        message:'Failed to fetch leagues',
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
    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data?.message || 'Failed to join league' };
    }
    return data;
  },
};

// Matches API Functions
export const matchAPI = {
  getMatches: async (): Promise<ApiResponse<Match[]>> => {
    try {
      const token = getAuthToken();
      
      if (!token || token === 'undefined' || token === 'null') {
        console.error('❌ getMatches: No valid token found');
        return {
          success: false,
          message: 'No authentication token',
          error: 'No authentication token'
        };
      }

      const response = await fetch(`${API_BASE_URL}/matches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return {
          success: false,
          message:`Server returned ${response.status}: ${response.statusText}`,
          error: `Server returned ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.matches,
        error: data.error,
        message:data.message
      };
    } catch (error) {
      return {
        success: false,
        message:'Failed to fetch matches',
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
        error: data.error,
        message:data.message,
      };
    } catch (error) {
      return {
        success: false,
        message:'Failed to fetch leagues',
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
        error: data.error,
        message:data.message
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update profile picture',
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
      const token = Cookies.get('token') || Cookies.get('auth_token');
      
      if (!token || token === 'undefined' || token === 'null') {
        console.error('❌ getProfile: No valid token found');
        return {
          success: false,
          message: 'No authentication token',
          error: 'No authentication token'
        };
      }

      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.user,
        error: data.error,
        message:data.message
      };
    } catch (error) {
      return {
        success: false,
        message:'Failed to fetch profile',
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
        error: data.error,
        message:data.message
      };
    } catch (error) {
      return {
        success: false,
        message:'Failed to update profile',
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
        error: data.error,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        message:'Failed to update skills',
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
        error: data.error,
        message:data.message
      };
    } catch (error) {
      return {
        success: false,
        message:'Failed to fetch statistics',
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
        error: data.error,
        message:data.message
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch leagues',
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
        error: data.error,
        message:data.message
      };
    } catch (error) {
      return {
        success: false,
        message:'Failed to fetch matches',
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
        error: data.error,
        message:data.message
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update profile picture',
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

type PartialSkillSet = Partial<SkillSet>;

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  age?: number;
  gender?: string;
  position?: string;
  positionType?: string;
  style?: string;
  preferredFoot?: string;
  password?: string;
  shirtNumber?: string;
  skills?: PartialSkillSet;
  country?: string;
  state?: string;
  city?: string;
  phone?: string;
  phoneCountryCode?: string | null;
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

export async function deleteProfilePicture(token: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const res = await fetch(`${apiUrl}/profile/picture`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = { message: 'Invalid server response' };
  }
  return { ok: res.ok, data };
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
  getPlayedWith: async (token: string, leagueId?: string): Promise<ApiResponse<Player[]>> => {
    try {
      const url = new URL(`${API_BASE_URL}/players/played-with`);
      if (leagueId && leagueId !== 'all') url.searchParams.set('leagueId', leagueId);
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, message:'Failed to fetch players' , error: errorData.message || 'Failed to fetch players' };
      }

      const data = await response.json();
      return { success: true, data: data.players , message:data.message };

    } catch (error) {
      return { success: false, message:'An unexpected error occurred' ,error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  },

  // Fetch members of a league even if they haven't played any match
  getLeagueMembers: async (token: string, leagueId: string): Promise<ApiResponse<Player[]>> => {
    try {
      const url = new URL(`${API_BASE_URL}/players/by-league`);
      url.searchParams.set('leagueId', leagueId);
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        return { success: false, message: data?.message || 'Failed to fetch league members', error: data?.message || 'Failed to fetch league members' };
      }
      return { success: true, data: data.players, message: data.message };
    } catch (error) {
      return { success: false, message: 'An unexpected error occurred', error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  },

  getPlayerStats: async (playerId: string, leagueId: string, year: string): Promise<ApiResponse<PlayerStatsData>> => {
    try {
        const token = Cookies.get('token');
        const params = new URLSearchParams({
          leagueId: leagueId || 'all',
          year: year || 'all',
          _t: String(Date.now())
        });
        // Use the new comprehensive profile endpoint
        const response = await fetch(`${API_BASE_URL}/players/${playerId}/profile?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, message: 'Failed to fetch player stats' , error: errorData.message || 'Failed to fetch player stats' };
        }

        const data = await response.json();
        return { success: true, data: data.data , message:data.message };
    } catch (error) {
        return { success: false, message:'An unexpected error occurred' ,error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  },

  // Fetch player XP with filters (league/year)
  getPlayerXP: async (playerId: string, leagueId?: string, year?: string): Promise<ApiResponse<{ totalXP: number; avgXP: number; matches: number }>> => {
    try {
      const token = Cookies.get('token');
      const params = new URLSearchParams();
      if (leagueId) params.append('leagueId', leagueId);
      if (year) params.append('year', year);
      const url = `${API_BASE_URL}/players/${playerId}/xp?${params.toString()}`;
      const res = await fetch(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
      
      // Check if response is JSON before parsing
      if (!res.ok) {
        console.warn('[getPlayerXP] API returned error:', res.status, res.statusText);
        return { success: false, message: 'Failed to fetch XP', error: `API Error: ${res.status}` };
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('[getPlayerXP] Response is not JSON:', contentType);
        return { success: false, message: 'Failed to fetch XP', error: 'Invalid response format' };
      }
      
      const json = await res.json();
      if (!json?.success) {
        return { success: false, message: 'Failed to fetch XP', error: json?.message || 'Failed to fetch XP' };
      }
      const { totalXP, avgXP, matches } = json.data || {};
      return { success: true, message: 'OK', data: { totalXP: Number(totalXP)||0, avgXP: Number(avgXP)||0, matches: Number(matches)||0 } };
    } catch (e) {
      console.error('[getPlayerXP] Error:', e);
      return { success: false, message: 'Failed to fetch XP', error: e instanceof Error ? e.message : 'Failed to fetch XP' };
    }
  },

  // Fetch player trophies (accumulative) with optional filters
  getPlayerTrophies: async (playerId: string, leagueId?: string, year?: string, seasonId?: string): Promise<ApiResponse<{ trophies: Record<string, { leagueId: string; leagueName: string }[]>; counts: Record<string, number> }>> => {
    try {
      const token = Cookies.get('token');
      const params = new URLSearchParams();
      if (leagueId && leagueId !== 'all') params.append('leagueId', leagueId);
      if (year && year !== 'all') params.append('year', year);
      if (seasonId && seasonId !== 'all') params.append('seasonId', seasonId);
      params.append('_t', String(Date.now()));
      const url = `${API_BASE_URL}/players/${playerId}/trophies?${params.toString()}`;
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        cache: 'no-store'
      });
      
      if (!res.ok) {
        console.warn('[getPlayerTrophies] API returned error:', res.status, res.statusText);
        return { success: false, message: 'Failed to fetch trophies', error: `API Error: ${res.status}` };
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('[getPlayerTrophies] Response is not JSON:', contentType);
        return { success: false, message: 'Failed to fetch trophies', error: 'Invalid response format' };
      }
      
      const json = await res.json();
      if (!json?.success) {
        return { success: false, message: 'Failed to fetch trophies', error: json?.message || 'Failed to fetch trophies' };
      }
      return { success: true, message: 'OK', data: json.data };
    } catch (e) {
      console.error('[getPlayerTrophies] Error:', e);
      return { success: false, message: 'Failed to fetch trophies', error: e instanceof Error ? e.message : 'Failed to fetch trophies' };
    }
  },

  // Fetch player history records (win streak, most goals, etc.)
  getPlayerHistoryRecords: async (playerId: string, leagueId?: string, year?: string, seasonId?: string): Promise<ApiResponse<{ longestWinStreak: number; mostGoalsInLeague: number; mostMotmInLeague: number; longestWinMargin: string; highestXpInLeague: number }>> => {
    try {
      const token = Cookies.get('token');
      const params = new URLSearchParams();
      if (leagueId && leagueId !== 'all') params.append('leagueId', leagueId);
      if (year && year !== 'all') params.append('year', year);
      if (seasonId && seasonId !== 'all') params.append('seasonId', seasonId);
      params.append('_t', String(Date.now()));
      const url = `${API_BASE_URL}/players/${playerId}/history-records?${params.toString()}`;
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        cache: 'no-store'
      });
      
      if (!res.ok) {
        console.warn('[getPlayerHistoryRecords] API returned error:', res.status, res.statusText);
        return { success: false, message: 'Failed to fetch history records', error: `API Error: ${res.status}` };
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('[getPlayerHistoryRecords] Response is not JSON:', contentType);
        return { success: false, message: 'Failed to fetch history records', error: 'Invalid response format' };
      }
      
      const json = await res.json();
      if (!json?.success) {
        return { success: false, message: 'Failed to fetch history records', error: json?.message || 'Failed to fetch history records' };
      }
      return { success: true, message: 'OK', data: json.data };
    } catch (e) {
      console.error('[getPlayerHistoryRecords] Error:', e);
      return { success: false, message: 'Failed to fetch history records', error: e instanceof Error ? e.message : 'Failed to fetch history records' };
    }
  }
}

// Achievements API Functions
export const achievementsAPI = {
  // Persist achievements XP to the current user's profile
  awardMine: async (): Promise<{ success: boolean; totalXP?: number; achievements?: string[]; message?: string } > => {
    try {
      const token = Cookies.get('token');
      if (!token) return { success: false, message: 'Not authenticated' };
      const res = await fetch(`${API_BASE_URL}/users/me/achievements/award`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        return { success: false, message: json?.message || 'Failed to award achievements' };
      }
      return { success: true, totalXP: Number(json.totalXP) || 0, achievements: json.achievements };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'Failed to award achievements' };
    }
  }
}

// --- LocalStorage Cache Utility ---
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const NO_CACHE_MODE = !['0', 'false', 'no', 'off'].includes(
  (process.env.NEXT_PUBLIC_NO_CACHE || 'true').toLowerCase()
);
export function getCache<T>(key: string): T | null {
  if (NO_CACHE_MODE) return null;
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

export function setCache<T>(key: string, data: T) {
  if (NO_CACHE_MODE) return;
  if (typeof window === 'undefined') return;
  const value = JSON.stringify({ data, expiry: Date.now() + CACHE_TTL });
  localStorage.setItem(key, value);
  Cookies.set(key, value, { expires: 1/144 }); // ~10 min
}

// Helper to ensure profilePicture is string | undefined
function normalizeProfilePicture(pic: string | null | undefined): string | undefined {
  return pic === null ? undefined : pic;
}

// Helper to create a default LeaderboardPlayer
function createLeaderboardPlayer(
  playerId: string,
  value: number,
  metric: keyof LeaderboardResponse['players'][number]
): LeaderboardResponse['players'][number] {
  return {
    id: playerId,
    name: '', // Default empty, should be filled by caller if possible
    positionType: '',
    profilePicture: undefined,
    value,
    [metric]: value
  } as LeaderboardResponse['players'][number];
}

// Helper to convert User to PlayerListItem
function toPlayerListItem(user: User): PlayersResponse['players'][number] {
  return {
    ...user,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    profilePicture: normalizeProfilePicture(user.profilePicture),
    rating: (user as User & { rating?: number }).rating ?? 0,
  };
}

// Helper to convert User[] to MatchUser[]
function toMatchUserArray(users: User[] | undefined): MatchUser[] {
  if (!users) return [];
  return users.map(u => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    profilePicture: normalizeProfilePicture(u.profilePicture),
  }));
}

// Leagues
export function updateLeaguesCache(newLeague: League) {
  const key = 'leagues_cache';
  const existing = getCache<LeaguesResponse>(key);
  if (existing && existing.leagues) {
    const updatedLeagues = [newLeague, ...existing.leagues];
    setCache(key, { ...existing, leagues: updatedLeagues });
  } else {
    setCache(key, { success: true, leagues: [newLeague] });
  }
}

export function updateLeaguesCacheOnJoin(joinedLeague: League) {
  const key = 'leagues_cache';
  const existing = getCache<LeaguesResponse>(key);
  if (existing && existing.leagues) {
    const leagueExists = existing.leagues.some(league => league.id === joinedLeague.id);
    if (!leagueExists) {
      const updatedLeagues = [...existing.leagues, joinedLeague];
      setCache(key, { ...existing, leagues: updatedLeagues });
    }
  }
}

// Leaderboard
export function updateLeaderboardCache(
  playerId: string,
  value: number,
  metric: keyof LeaderboardResponse['players'][number],
  cacheKey: string = 'leaderboard_cache'
) {
  const existing = getCache<LeaderboardResponse>(cacheKey);
  if (existing && existing.players) {
    const playerIndex = existing.players.findIndex(player => player.id === playerId);
    if (playerIndex !== -1) {
      const updatedPlayers = [...existing.players];
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        [metric]: value
      };
      setCache(cacheKey, { ...existing, players: updatedPlayers });
    } else {
      // Add new player with safe defaults
      const newPlayer = createLeaderboardPlayer(playerId, value, metric);
      setCache(cacheKey, { ...existing, players: [...existing.players, newPlayer] });
    }
  }
}

// Players
export function updatePlayersCache(newPlayer: User) {
  const key = 'players_cache';
  const existing = getCache<PlayersResponse>(key);
  if (existing && existing.players) {
    const playerIndex = existing.players.findIndex(player => player.id === newPlayer.id);
    const normalizedPlayer = toPlayerListItem(newPlayer);
    if (playerIndex !== -1) {
      const updatedPlayers = [...existing.players];
      updatedPlayers[playerIndex] = { ...updatedPlayers[playerIndex], ...normalizedPlayer };
      setCache(key, { ...existing, players: updatedPlayers });
    } else {
      setCache(key, { ...existing, players: [...existing.players, normalizedPlayer] });
    }
  }
}

// Player Stats
export function updatePlayerStatsCache(playerId: string, newStats: PlayerStatsResponse) {
  const key = `playerstats_cache_${playerId}`;
  const existing = getCache<PlayerStatsResponse>(key);
  if (existing) {
    setCache(key, { ...existing, ...newStats });
  }
}

// Matches
export function updateMatchesCache(newMatch: Match) {
  const key = 'matches_cache';
  const existing = getCache<MatchesResponse>(key);
  if (existing && existing.matches) {
    const matchIndex = existing.matches.findIndex(match => match.id === newMatch.id);
    // Convert homeTeamUsers and awayTeamUsers
    const normalizedMatch = {
      ...newMatch,
      homeTeamUsers: toMatchUserArray((newMatch as Match & { homeTeamUsers?: User[] }).homeTeamUsers),
      awayTeamUsers: toMatchUserArray((newMatch as Match & { awayTeamUsers?: User[] }).awayTeamUsers),
      profilePicture: normalizeProfilePicture((newMatch as Match & { profilePicture?: string | null }).profilePicture),
    };
    if (matchIndex !== -1) {
      const updatedMatches = [...existing.matches];
      updatedMatches[matchIndex] = { ...updatedMatches[matchIndex], ...normalizedMatch };
      setCache(key, { ...existing, matches: updatedMatches });
    } else {
      setCache(key, { ...existing, matches: [...existing.matches, normalizedMatch] });
    }
  }
}

// Dream Team
export function updateDreamTeamCache(newDreamTeam: DreamTeamResponse) {
  const key = 'dreamteam_cache';
  const existing = getCache<DreamTeamResponse>(key);
  if (existing) {
    setCache(key, { ...existing, ...newDreamTeam });
  }
}

// Generic
export function updateAnyCache<T>(cacheKey: string, newData: T, mergeFunction?: (existing: T, newData: T) => T) {
  const existing = getCache<T>(cacheKey);
  if (existing) {
    const updatedData = mergeFunction ? mergeFunction(existing, newData) : newData;
    setCache(cacheKey, updatedData);
  } else {
    setCache(cacheKey, newData);
  }
}

// World Ranking -------------------------------------------------------------
// Note: Guest players are automatically excluded from world ranking by the backend
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
  country?: string; // Optional country for display/filtering
}
export interface WorldRankingResponse {
  players: WorldRankingPlayer[]; mode: 'avg'|'total'; limit: number; playerOutsideTop?: boolean; playerRank?: number; years?: number[];
}
export async function fetchWorldRanking(params: { mode?: 'avg'|'total'; playerId?: string; positionType?: string; year?: number; country?: string; limit?: number; token?: string }) {
  const { token, ...rest } = params || {};
  const mode = params.mode || 'total';
  const search = new URLSearchParams();
  Object.entries(rest).forEach(([k,v])=>{ if(v!==undefined && v!==null) search.append(k, String(v)); });
  // Always request fresh on non-local to avoid stale caches after new players are saved
  const isLocal = typeof window !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  if (!isLocal) search.set('fresh', '1');
  const url = `${process.env.NEXT_PUBLIC_API_URL}/world-ranking?${search.toString()}`;
  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if(!res.ok) throw new Error('Failed world ranking');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any = await res.json();
  // Server returns { success, rankings: [...] } — map to expected WorldRankingResponse shape
  // Each ranking item has `xp` which is totalXP or avgXP depending on the requested mode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawList: any[] = Array.isArray(raw?.rankings) ? raw.rankings : (Array.isArray(raw?.players) ? raw.players : []);
  const players: WorldRankingPlayer[] = rawList.map(p => ({
    id: p.id,
    name: p.name,
    position: p.position || '',
    positionType: p.positionType || '',
    profilePicture: p.profilePicture || '',
    totalXP: mode === 'total' ? (p.xp ?? p.totalXP ?? 0) : (p.totalXP ?? p.xp ?? 0),
    avgXP: mode === 'avg' ? (p.xp ?? p.avgXP ?? 0) : (p.avgXP ?? 0),
    matches: p.matches ?? 0,
    rank: p.rank ?? 0,
    country: p.country || undefined,
  }));
  return {
    players,
    mode: mode as 'avg' | 'total',
    limit: raw?.limit ?? players.length,
    playerOutsideTop: raw?.playerOutsideTop,
    playerRank: raw?.playerRank,
    years: Array.isArray(raw?.years)
      ? raw.years.map((v: unknown) => Number(v)).filter((n: number) => Number.isFinite(n))
      : (Array.isArray(raw?.availableYears)
        ? raw.availableYears.map((v: unknown) => Number(v)).filter((n: number) => Number.isFinite(n))
        : undefined),
  } as WorldRankingResponse;
}
