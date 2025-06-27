import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../api';
import Cookies from 'js-cookie';
import { AuthState, LoginCredentials, RegisterCredentials, ApiResponse } from '@/types/api';
import { User } from '@/types/user';

// Cookie options for 7 days
const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const
};

// Initial state without any client-side data
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  userData: {
    joinedLeagues: [],
    managedLeagues: [],
    homeTeamMatches: [],
    awayTeamMatches: [],
    availableMatches: [],
    guestMatch: null
  }
};

// Function to sync state with localStorage
const syncStateWithStorage = (state: AuthState) => {
  if (typeof window === 'undefined') return;
  
  if (state.isAuthenticated && state.user && state.token) {
    // Save to localStorage with 7 days expiry
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    
    localStorage.setItem('user', JSON.stringify(state.user));
    localStorage.setItem('userData', JSON.stringify(state.userData));
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('sessionExpiry', expiryDate.toISOString());
    
    // Set cookie with 7 days expiry
    Cookies.set('token', state.token, COOKIE_OPTIONS);
  }
};

// Function to check if session is expired
const isSessionExpired = () => {
  if (typeof window === 'undefined') return true;
  
  const expiryDate = localStorage.getItem('sessionExpiry');
  if (!expiryDate) return true;
  
  return new Date(expiryDate) < new Date();
};

// Function to load session from storage
const loadSessionFromStorage = (): AuthState => {
  if (typeof window === 'undefined') return initialState;

  // Check if session is expired
  if (isSessionExpired()) {
    // Clear expired session
    Cookies.remove('token', { path: '/' });
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('sessionExpiry');
    return initialState;
  }

  const storedUser = localStorage.getItem('user');
  const storedUserData = localStorage.getItem('userData');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const token = Cookies.get('token');

  if (storedUser && storedUserData && isAuthenticated && token) {
    try {
      const user = JSON.parse(storedUser);
      const userData = JSON.parse(storedUserData);
      return {
        user,
        userData,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      return initialState;
    }
  }

  return initialState;
};

export const login = createAsyncThunk<ApiResponse<User>, LoginCredentials>(
  'auth/login',
  async (credentials) => {
    const response = await authAPI.login(credentials);
    return response;
  }
);

export const register = createAsyncThunk<ApiResponse<User>, RegisterCredentials>(
  'auth/register',
  async (credentials) => {
    const response = await authAPI.register(credentials);
    return response;
  }
);

export const checkAuth = createAsyncThunk<ApiResponse<User>>(
  'auth/check',
  async () => {
    // Check if session is expired
    if (isSessionExpired()) {
      return {
        success: false,
        error: 'Session expired'
      };
    }
    const response = await authAPI.checkAuth();
    
    // If successful, save the user data to localStorage
    if (response.success && response.data) {
      const userData = {
        joinedLeagues: response.data.joinedLeagues || [],
        managedLeagues: response.data.managedLeagues || [],
        homeTeamMatches: response.data.homeTeamMatches || [],
        awayTeamMatches: response.data.awayTeamMatches || [],
        availableMatches: response.data.availableMatches || [],
        guestMatch: response.data.guestMatch || null
      };
      
      localStorage.setItem('user', JSON.stringify(response.data));
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      localStorage.setItem('sessionExpiry', expiryDate.toISOString());
    }
    
    return response;
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    if (typeof window !== 'undefined') {
      // Clear all session data
      Cookies.remove('token', { path: '/' });
      localStorage.removeItem('user');
      localStorage.removeItem('userData');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('sessionExpiry');
    }
    return { success: true };
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    syncWithStorage: (state) => {
      syncStateWithStorage(state);
    },
    initializeFromStorage: (state) => {
      const sessionState = loadSessionFromStorage();
      state.user = sessionState.user;
      state.userData = sessionState.userData;
      state.token = sessionState.token;
      state.isAuthenticated = sessionState.isAuthenticated;
      state.loading = sessionState.loading;
      state.error = sessionState.error;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.isAuthenticated = true;
          state.user = action.payload.data || null;
          state.userData = {
            joinedLeagues: action.payload.data?.joinedLeagues || [],
            managedLeagues: action.payload.data?.managedLeagues || [],
            homeTeamMatches: action.payload.data?.homeTeamMatches || [],
            awayTeamMatches: action.payload.data?.awayTeamMatches || [],
            availableMatches: action.payload.data?.availableMatches || [],
            guestMatch: action.payload.data?.guestMatch || null
          };
          state.token = action.payload.token || null;
          state.error = null;
          syncStateWithStorage(state);
        } else {
          state.error = action.payload.error || 'Login failed';
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.data || null;
        state.userData = {
          joinedLeagues: action.payload.data?.joinedLeagues || [],
          managedLeagues: action.payload.data?.managedLeagues || [],
          homeTeamMatches: action.payload.data?.homeTeamMatches || [],
          awayTeamMatches: action.payload.data?.awayTeamMatches || [],
          availableMatches: action.payload.data?.availableMatches || [],
          guestMatch: action.payload.data?.guestMatch || null
        };
        state.token = action.payload.token || null;
        state.error = null;
        syncStateWithStorage(state);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      })
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.isAuthenticated = true;
          state.user = action.payload.data || null;
          state.userData = {
            joinedLeagues: action.payload.data?.joinedLeagues || [],
            managedLeagues: action.payload.data?.managedLeagues || [],
            homeTeamMatches: action.payload.data?.homeTeamMatches || [],
            awayTeamMatches: action.payload.data?.awayTeamMatches || [],
            availableMatches: action.payload.data?.availableMatches || [],
            guestMatch: action.payload.data?.guestMatch || null
          };
          state.error = null;
          syncStateWithStorage(state);
        } else {
          state.isAuthenticated = false;
          state.user = null;
          state.userData = initialState.userData;
          state.error = action.payload.error || 'Authentication check failed';
        }
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.userData = initialState.userData;
        state.error = action.error.message || 'Authentication check failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.userData = initialState.userData;
        state.token = null;
        state.error = null;
        // Clear all session data
        if (typeof window !== 'undefined') {
          Cookies.remove('token', { path: '/' });
          localStorage.removeItem('user');
          localStorage.removeItem('userData');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('sessionExpiry');
        }
      });
  },
});

export const { clearError, syncWithStorage, initializeFromStorage } = authSlice.actions;
export default authSlice.reducer; 