import { User, League, Match } from './user';

export interface ApiResponse<T> {
  message: string;
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
    
// --- API Response Types for Backend Integration ---

// Leagues
export interface LeagueMember {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
  positionType?: string;
  profilePicture?: string;
}
export interface LeagueMatch {
  id: string;
  homeTeamUsers?: LeagueMember[];
  awayTeamUsers?: LeagueMember[];
  statistics?: MatchStatistic[];
  // Add explicit fields as needed
  date?: string;
  leagueId?: string;
  homeTeamGoals?: number;
  awayTeamGoals?: number;
}
export interface MatchStatistic {
  id: string;
  user_id: string;
  match_id: string;
  goals?: number;
  assists?: number;
  cleanSheets?: number;
  [key: string]: string | number | undefined;
}
export interface LeagueApi {
  id: string;
  name: string;
  members?: LeagueMember[];
  administeredLeagues?: LeagueMember[];
  matches?: LeagueMatch[];
  // Add explicit fields as needed
  description?: string;
  startDate?: string;
}
export interface LeaguesResponse {
  success: boolean;
  leagues: LeagueApi[];
}

// Leaderboard
export interface LeaderboardPlayer {
  id: string;
  name: string;
  positionType?: string;
  profilePicture?: string;
  value?: number;
}
export interface LeaderboardResponse {
  players: LeaderboardPlayer[];
  message?: string;
}

// Players
export interface PlayerListItem {
  id: string;
  name: string;
  profilePicture?: string;
  rating?: number;
  position?: string;
  positionType?: string;
}
export interface PlayersResponse {
  success: boolean;
  players: PlayerListItem[];
}

// Matches
export interface MatchUser {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
}
export interface MatchApi {
  id: string;
  homeTeamUsers?: MatchUser[];
  awayTeamUsers?: MatchUser[];
  votes?: VoteApi[];
  date?: string;
  leagueId?: string;
  homeTeamGoals?: number;
  awayTeamGoals?: number;
}
export interface VoteApi {
  id: string;
  matchId: string;
  voterId: string;
  votedForId: string;
}
export interface MatchesResponse {
  success: boolean;
  matches: MatchApi[];
}

// Dream Team
export interface DreamTeamPlayer {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
  profilePicture?: string;
  xp?: number;
  achievements?: string[];
  stats: {
    matchesPlayed: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    motm: number;
    winPercentage: number;
    points: number;
  };
}
export interface DreamTeamResponse {
  success: boolean;
  dreamTeam: DreamTeamPlayer[];
  totalPlayers: number;
}

// Player Stats (Trophy Room)
export interface PlayerStats {
  id: string;
  name: string;
  position?: string;
  rating?: number;
  avatar?: string;
  age?: number;
  style?: string;
  positionType?: string;
  preferredFoot?: string;
  shirtNo?: string;
}
export interface PlayerStatsResponse {
  success: boolean;
  data: {
    player: PlayerStats;
    leagues: LeagueApi[];
    years: number[];
    currentStats: Record<string, number>;
    accumulativeStats: Record<string, number>;
    trophies: Record<string, { leagueId: string; leagueName: string }[]>;
  };
}

// --- Cache Utility Types ---
export interface CacheEntry<T> {
  data: T;
  expiry: number;
} 
    