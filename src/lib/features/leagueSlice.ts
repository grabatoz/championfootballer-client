import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { leagueAPI } from '../api';
import {  CreateLeagueDTO } from '@/types/api';
import { League } from '@/types/user';
import type { RootState } from '../store';
import { getAuthToken } from '../tokenManager';

interface LeagueState {
  leagues: League[];
  currentLeague: League | null;
  loading: boolean;
  error: string | null;
}

const initialState: LeagueState = {
  leagues: [],
  currentLeague: null,
  loading: false,
  error: null,
};

const resolveAuthToken = (state: RootState | undefined): string | null => {
  const stateToken = state?.auth?.token;
  if (typeof stateToken === 'string') {
    const trimmed = stateToken.trim();
    if (trimmed && trimmed !== 'undefined' && trimmed !== 'null') {
      return trimmed;
    }
  }

  return getAuthToken();
};

export const createLeague = createAsyncThunk(
  'league/create',
  async (leagueData: CreateLeagueDTO, { rejectWithValue, getState }) => {
    try {
      const token = resolveAuthToken(getState() as RootState | undefined);
      if (!token) {
        return rejectWithValue('No authentication token');
      }
      const response = await leagueAPI.createLeague(token, leagueData);
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to create league');
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

export const joinLeague = createAsyncThunk(
  'league/join',
  async (inviteCode: string, { rejectWithValue, getState }) => {
    try {
      const token = resolveAuthToken(getState() as RootState | undefined);
      if (!token) {
        return rejectWithValue('No authentication token');
      }
      const response = await leagueAPI.joinLeague(token, inviteCode);
      if (!response.success) {
        return rejectWithValue(response.message || response.error || 'Failed to join league');
      }
      return response;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

const leagueSlice = createSlice({
  name: 'league',
  initialState,
  reducers: {
    clearLeagueError: (state) => {
      state.error = null;
    },
    setCurrentLeague: (state, action) => {
      state.currentLeague = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create League
      .addCase(createLeague.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLeague.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.leagues.push(action.payload);
        }
      })
      .addCase(createLeague.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Join League
      .addCase(joinLeague.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinLeague.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.leagues.push(action.payload);
        }
      })
      .addCase(joinLeague.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearLeagueError, setCurrentLeague } = leagueSlice.actions;
export default leagueSlice.reducer; 
