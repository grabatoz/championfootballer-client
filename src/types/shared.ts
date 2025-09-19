export interface Skills {
  dribbling: number;
  shooting: number;
  passing: number;
  pace: number;
  defending: number;
  physical: number;
}

export interface League {
  id: string;
  name: string;
  description?: string;
  location?: string;
  maxTeams?: number;
  currentTeams?: number;
  status?: 'active' | 'inactive' | 'completed';
  createdAt?: string;
  updatedAt?: string;
  adminId?: string;
  // Additional fields
  image?: string;
  inviteCode?: string;
  members?: User[];
  administrators?: User[];
  matches?: Match[];
  active?: boolean;
  maxGames?: number;
  showPoints?: boolean;
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
  availableUsers?: User[];
  homeTeamUsers?: User[];
  awayTeamUsers?: User[];
  end: string;
  active: boolean;
  awayTeamImage: string;
  homeTeamImage: string;
  // Optional additional fields
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
  skills: Skills;
  joinedLeagues: League[];
  managedLeagues: League[];
  homeTeamMatches: Match[];
  awayTeamMatches: Match[];
  availableMatches: Match[];
}

export interface UserData {
  joinedLeagues: League[];
  managedLeagues: League[];
  homeTeamMatches: Match[];
  awayTeamMatches: Match[];
  availableMatches: Match[];
  guestMatch: Match | null;
}

// Type guards for runtime type checking
export function isUser(obj: unknown): obj is User {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof (obj as User).id === 'string' &&
    typeof (obj as User).email === 'string' &&
    typeof (obj as User).firstName === 'string' &&
    typeof (obj as User).lastName === 'string'
  );
}

export function isLeague(obj: unknown): obj is League {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof (obj as League).id === 'string' &&
    typeof (obj as League).name === 'string' &&
    typeof (obj as League).active === 'boolean'
  );
}

export function isMatch(obj: unknown): obj is Match {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof (obj as Match).id === 'string' &&
    typeof (obj as Match).date === 'string' &&
    typeof (obj as Match).location === 'string' &&
    typeof (obj as Match).status === 'string'
  );
}

export function isSkills(obj: unknown): obj is Skills {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof (obj as Skills).dribbling === 'number' &&
    typeof (obj as Skills).shooting === 'number' &&
    typeof (obj as Skills).passing === 'number' &&
    typeof (obj as Skills).pace === 'number' &&
    typeof (obj as Skills).defending === 'number' &&
    typeof (obj as Skills).physical === 'number'
  );
}

// Array validation helpers - YE MISSING THE!
export function isUserArray(obj: unknown): obj is User[] {
  return Array.isArray(obj) && obj.every(item => isUser(item));
}

export function isLeagueArray(obj: unknown): obj is League[] {
  return Array.isArray(obj) && obj.every(item => isLeague(item));
}

export function isMatchArray(obj: unknown): obj is Match[] {
  return Array.isArray(obj) && obj.every(item => isMatch(item));
}

// Additional API response types
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

// Utility type for API responses
export interface ApiResponse<T = User | League | Match | UserData> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  token?: string;
}