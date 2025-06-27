import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { matchAPI } from '../api';
import { CreateMatchDTO, Match } from '@/types/api';

interface MatchState {
  matches: Match[];
  currentMatch: Match | null;
  loading: boolean;
  error: string | null;
}

const initialState: MatchState = {
  matches: [],
  currentMatch: null,
  loading: false,
  error: null,
};

export const fetchMatches = createAsyncThunk(
  'match/fetchAll',
  async (leagueId: string | undefined, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: { token: string | null } };
      if (!auth.token) {
        return rejectWithValue('No authentication token');
      }
      const response = await matchAPI.getMatches();
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to fetch matches');
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

export const createMatch = createAsyncThunk(
  'match/create',
  async (matchData: CreateMatchDTO, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: { token: string | null } };
      if (!auth.token) {
        return rejectWithValue('No authentication token');
      }
      const response = await matchAPI.createMatch(auth.token, matchData);
      return response;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }    
);

const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    clearMatchError: (state) => {
      state.error = null;
    },
    setCurrentMatch: (state, action) => {
      state.currentMatch = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Matches
      .addCase(fetchMatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.loading = false;
        state.matches = action.payload;
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Match
      .addCase(createMatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMatch.fulfilled, (state, action) => {
        state.loading = false;
        state.matches.push(action.payload);
      })
      .addCase(createMatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearMatchError, setCurrentMatch } = matchSlice.actions;
export default matchSlice.reducer; 