export interface Skills {
  dribbling: number;
  shooting: number;
  passing: number;
  pace: number;
  defending: number;
  physical: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age?: number | string;
  password?: string;
  gender?: string;
  level?: string;
  joinedLeagues?: League[];
  managedLeagues?: League[];
  homeTeamMatches?: Match[];
  awayTeamMatches?: Match[];
  availableMatches?: Match[];
  guestMatch?: Match | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  position?: string;
  style?: string;
  preferredFoot?: string;
  shirtNumber?: string;
  profilePicture?: string | null;
  positionType: string;
  skills?: Skills;
  xp?: number;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

// Forward declaration for circular reference
export interface League {
  image: string;
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  members: User[];
  administrators: User[];
  matches: Match[];
  active: boolean;
  maxGames: number;
  showPoints: boolean;
  adminId?: string;
  description?: string;
  location?: string;
  maxTeams?: number;
  currentTeams?: number;
  status?: 'active' | 'inactive' | 'completed';
  updatedAt?: string;
}

export interface Match {
  id: string;
  date: string;
  location: string;
  status: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamGoals?: number;
  awayTeamGoals?: number;
  availableUsers: User[];
  homeTeamUsers: User[];
  awayTeamUsers: User[];
  end: string;
  active: boolean;
  awayTeamImage: string;
  homeTeamImage: string;
  // Additional fields for compatibility
  homeTeamId?: string;
  awayTeamId?: string;
  leagueId?: string;
  scheduledAt?: string;
  homeScore?: number;
  awayScore?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NormalizedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  age: number | null;
  gender: string | null;
  position: string;
  positionType: string;
  style: string;
  preferredFoot: string;
  shirtNumber: string;
  profilePicture: string | null;
  skills: Skills; // Use the Skills interface instead of inline object
  joinedLeagues: League[]; // Replace any[] with League[]
  managedLeagues: League[]; // Replace any[] with League[]
  homeTeamMatches: Match[]; // Replace any[] with Match[]
  awayTeamMatches: Match[]; // Replace any[] with Match[]
  availableMatches: Match[]; // Replace any[] with Match[]
}

// Additional helper interfaces for data handling
export interface UserData {
  joinedLeagues: League[];
  managedLeagues: League[];
  homeTeamMatches: Match[];
  awayTeamMatches: Match[];
  availableMatches: Match[];
  guestMatch: Match | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  position: string;
  positionType: string;
  style: string;
  preferredFoot: string;
  shirtNumber: string;
  age?: number;
  gender?: string;
}

// Type guards for runtime type checking
export function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
}

export function isLeague(obj: any): obj is League {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}

export function isMatch(obj: any): obj is Match {
  return obj && typeof obj.id === 'string' && typeof obj.date === 'string';
}

// Utility type for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  token?: string;
}