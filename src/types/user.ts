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
  joinedLeagues?: any[];
  managedLeagues?: any[];
  homeTeamMatches?: any[];
  awayTeamMatches?: any[];
  availableMatches?: any[];
  guestMatch?: any | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  position?: string;
  style?: string;
  preferredFoot?: string;
  shirtNumber?: string;
  profilePicture?: string | null;
  skills?: Skills;
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