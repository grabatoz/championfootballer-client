import { User, League, Match } from './user';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  token?: string;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  position?: string;
  positionType?: string;
  confirmPassword?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  userData: {
    joinedLeagues: League[];
    managedLeagues: League[];
    homeTeamMatches: Match[];
    awayTeamMatches: Match[];
    availableMatches: Match[];
    guestMatch: Match | null;
  };
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
} 

// types/api.ts

export interface CreateLeagueDTO {
    name: string;
    description?: string;
    startDate?: string;
    [key: string]: unknown; // Optional for flexibility
  }
  
  export interface CreateMatchDTO {
    leagueId: string;
    teamAId: string;
    teamBId: string;
    matchDate: string;
    location?: string;
    [key: string]: unknown; // Optional for flexibility
  }
  export interface UpdateMatchDTO {
    leagueId?: string;
    teamAId?: string;
    teamBId?: string;
    matchDate?: string;
    location?: string;
    scoreA?: number;
    scoreB?: number;
    status?: 'scheduled' | 'completed' | 'cancelled'; // Example values
  }
    