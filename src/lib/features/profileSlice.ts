import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { profileAPI } from '../api';
import { User, League, Match } from '@/types/user';

interface Statistics {
  matchesPlayed: number;
  goalsScored: number;
  assists: number;
  wins: number;
  losses: number;
  draws: number;
}

interface ProfileState {
  user: User | null;
  statistics: Statistics | null;
  leagues: League[];
  matches: Match[];
  loading: boolean;
  error: string | null;
}


const initialState: ProfileState = {
  user: null,
  statistics: null,
  leagues: [],
  matches: [],
  loading: false,
  error: null
};

export const fetchProfile = createAsyncThunk(
  'profile/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await profileAPI.getProfile();
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to fetch profile');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'profile/update',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await profileAPI.updateProfile(userData);
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to update profile');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update profile');
    }
  }
);

export const fetchStatistics = createAsyncThunk(
  'profile/fetchStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await profileAPI.getStatistics();
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to fetch statistics');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch statistics');
    }
  }
);

export const fetchLeagues = createAsyncThunk(
  'profile/fetchLeagues',
  async (_, { rejectWithValue }) => {
    try {
      const response = await profileAPI.getLeagues();
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to fetch leagues');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch leagues');
    }
  }
);

export const fetchMatches = createAsyncThunk(
  'profile/fetchMatches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await profileAPI.getMatches();
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to fetch matches');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch matches');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload ?? null;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload ?? null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Statistics
      .addCase(fetchStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.statistics = action.payload ?? null;
      })
      .addCase(fetchStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Leagues
      .addCase(fetchLeagues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeagues.fulfilled, (state, action) => {
        state.loading = false;
        state.leagues = action.payload || [];
      })
      .addCase(fetchLeagues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Matches
      .addCase(fetchMatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.loading = false;
        state.matches = action.payload || [];
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearProfileError } = profileSlice.actions;
export default profileSlice.reducer; 