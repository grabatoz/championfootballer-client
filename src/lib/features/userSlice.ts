import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI, playerAPI } from '../api';
import type { User } from '@/types/user';

interface Player {
  id: string;
  name: string;
  profilePicture: string | null;
  rating: number;
}

interface UserState {
  data: Partial<User> | null;
  playedWithPlayers: Player[];
  leaguePlayers: Player[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  data: null,
  playedWithPlayers: [],
  leaguePlayers: [],
  loading: false,
  error: null,
};

export const fetchUserData = createAsyncThunk(
  'user/fetchData',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: { token: string | null } };
      if (!auth.token) {
        return rejectWithValue('No authentication token');
      }
      const response = await authAPI.getUserData(auth.token);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return response.user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

export const fetchPlayedWithPlayers = createAsyncThunk(
  'user/fetchPlayedWithPlayers',
  async (leagueId: string | undefined, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: { token: string | null } };
      if (!auth.token) {
        return rejectWithValue('No authentication token');
      }
      const response = await playerAPI.getPlayedWith(auth.token, leagueId);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

export const fetchLeaguePlayers = createAsyncThunk(
  'user/fetchLeaguePlayers',
  async (leagueId: string, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: { token: string | null } };
      if (!auth.token) {
        return rejectWithValue('No authentication token');
      }
      const response = await playerAPI.getLeagueMembers(auth.token, leagueId);
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to fetch league members');
      }
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    updateUserData: (state, action) => {
      state.data = { ...state.data, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPlayedWithPlayers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlayedWithPlayers.fulfilled, (state, action) => {
        state.loading = false;
        state.playedWithPlayers = action.payload || [];
      })
      .addCase(fetchPlayedWithPlayers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchLeaguePlayers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaguePlayers.fulfilled, (state, action) => {
        state.loading = false;
        state.leaguePlayers = action.payload || [];
      })
      .addCase(fetchLeaguePlayers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearUserError, updateUserData } = userSlice.actions;
export default userSlice.reducer;
