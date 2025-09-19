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

// Type guards for runtime type checking - NO MORE ANY!
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
    typeof (obj as League).inviteCode === 'string' &&
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

export function isNormalizedUser(obj: unknown): obj is NormalizedUser {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof (obj as NormalizedUser).id === 'string' &&
    typeof (obj as NormalizedUser).firstName === 'string' &&
    typeof (obj as NormalizedUser).lastName === 'string' &&
    typeof (obj as NormalizedUser).position === 'string' &&
    typeof (obj as NormalizedUser).positionType === 'string' &&
    isSkills((obj as NormalizedUser).skills) &&
    Array.isArray((obj as NormalizedUser).joinedLeagues) &&
    Array.isArray((obj as NormalizedUser).managedLeagues)
  );
}

export function isUserData(obj: unknown): obj is UserData {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    Array.isArray((obj as UserData).joinedLeagues) &&
    Array.isArray((obj as UserData).managedLeagues) &&
    Array.isArray((obj as UserData).homeTeamMatches) &&
    Array.isArray((obj as UserData).awayTeamMatches) &&
    Array.isArray((obj as UserData).availableMatches)
  );
}

// Utility types for API responses - NO MORE ANY!
export interface ApiResponse<T = User | League | Match | UserData> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  token?: string;
}

// Specific API response types for better type safety
export interface UserApiResponse extends ApiResponse<User> {
  data?: User;
}

export interface LeagueApiResponse extends ApiResponse<League> {
  data?: League;
}

export interface MatchApiResponse extends ApiResponse<Match> {
  data?: Match;
}

export interface UserDataApiResponse extends ApiResponse<UserData> {
  data?: UserData;
}

export interface LeaguesListApiResponse extends ApiResponse<League[]> {
  data?: League[];
}

export interface MatchesListApiResponse extends ApiResponse<Match[]> {
  data?: Match[];
}

// Authentication specific response types
export interface LoginApiResponse extends ApiResponse<User> {
  token?: string;
  data?: User;
}

export interface RegisterApiResponse extends ApiResponse<User> {
  token?: string;
  data?: User;
}

// Generic error response
export interface ErrorApiResponse extends ApiResponse<never> {
  success: false;
  error: string;
  message?: string;
}

// Utility functions for API response validation
export function isSuccessApiResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

export function isErrorApiResponse(
  response: ApiResponse<unknown>
): response is ErrorApiResponse {
  return response.success === false && typeof response.error === 'string';
}

// Array validation helpers
export function isUserArray(obj: unknown): obj is User[] {
  return Array.isArray(obj) && obj.every(item => isUser(item));
}

export function isLeagueArray(obj: unknown): obj is League[] {
  return Array.isArray(obj) && obj.every(item => isLeague(item));
}

export function isMatchArray(obj: unknown): obj is Match[] {
  return Array.isArray(obj) && obj.every(item => isMatch(item));
}