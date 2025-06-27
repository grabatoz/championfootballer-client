import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { leagueAPI } from '../api';
import { League, CreateLeagueDTO } from '@/types/api';
import Cookies from 'js-cookie';

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

export const fetchLeagues = createAsyncThunk(
  'league/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await leagueAPI.getLeagues();
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to fetch leagues');
      }
      return response.data || [];
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

export const createLeague = createAsyncThunk(
  'league/create',
  async (leagueData: CreateLeagueDTO, { rejectWithValue }) => {
    try {
      const token = Cookies.get('token');
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
  async (inviteCode: string, { rejectWithValue }) => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        return rejectWithValue('No authentication token');
      }
      const response = await leagueAPI.joinLeague(token, inviteCode);
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to join league');
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
      // Fetch Leagues
      .addCase(fetchLeagues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeagues.fulfilled, (state, action) => {
        state.loading = false;
        state.leagues = action.payload;
      })
      .addCase(fetchLeagues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
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