import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../api';
import User from '../../../api/src/models/User';

interface UserState {
  data: Partial<InstanceType<typeof User>> | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  data: null,
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
      });
  },
});

export const { clearUserError, updateUserData } = userSlice.actions;
export default userSlice.reducer; 