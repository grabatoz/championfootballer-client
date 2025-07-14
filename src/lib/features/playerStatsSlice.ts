import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { playerAPI } from '../api';

// --- Interfaces ---
interface PlayerDetails {
  id:string;
  name: string;
  position: string;
  rating: number;
  avatar: string | null;
  profilePicture: string | null;
  // Added fields for player profile page compatibility
  age?: number;
  style?: string;
  positionType?: string;
  preferredFoot?: string;
  careerStart?: string | number;
  careerEnd?: string | number;
  shirtNo?: string; // Added for shirt number display
}

interface LeagueInfo {
  id: string;
  name: string;
}

interface PlayerStatsData {
    player: PlayerDetails;
    leagues: LeagueInfo[];
    years: number[];
    currentStats: Record<string, number>;
    accumulativeStats: Record<string, number>;
    trophies: Record<string, number>;
}

interface PlayerStatsState {
  data: PlayerStatsData | null;
  filters: {
    leagueId: string;
    year: string;
  };
  loading: boolean;
  error: string | null;
}

// --- Initial State ---
const initialState: PlayerStatsState = {
  data: null,
  filters: {
    leagueId: 'all',
    year: 'all',
  },
  loading: false,
  error: null,
};

// --- Async Thunk ---
export const fetchPlayerStats = createAsyncThunk(
  'playerStats/fetchStats',
  async ({ playerId, leagueId, year }: { playerId: string; leagueId: string; year: string }, { rejectWithValue }) => {
    try {
      const response = await playerAPI.getPlayerStats(playerId, leagueId, year);
      if (response.success) {
        return response.data;
      }
      return rejectWithValue(response.error || 'Failed to fetch data.');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data.';
      return rejectWithValue(errorMessage);
    }
  }
);

// --- Slice Definition ---
const playerStatsSlice = createSlice({
  name: 'playerStats',
  initialState,
  reducers: {
    setLeagueFilter: (state, action: PayloadAction<string>) => {
      state.filters.leagueId = action.payload;
    },
    setYearFilter: (state, action: PayloadAction<string>) => {
      state.filters.year = action.payload;
    },
    clearPlayerStats: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlayerStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlayerStats.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload as PlayerStatsData ?? null;
      })
      .addCase(fetchPlayerStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setLeagueFilter, setYearFilter, clearPlayerStats } = playerStatsSlice.actions;

export default playerStatsSlice.reducer; 