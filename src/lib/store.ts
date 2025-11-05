import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import leagueReducer from './features/leagueSlice';
import matchReducer from './features/matchSlice';
import userReducer from './features/userSlice';
import profileReducer from './features/profileSlice';
import playerStatsReducer from './features/playerStatsSlice';
import { leaguesApi } from './features/leaguesApi';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
// import { apiMiddleware } from './middleware/apiMiddleware';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      league: leagueReducer,
      match: matchReducer,
      user: userReducer,
      profile: profileReducer,
      playerStats: playerStatsReducer,
      [leaguesApi.reducerPath]: leaguesApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore these action types
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
          // Ignore these field paths in all actions
          ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
          // Ignore these paths in the state
          ignoredPaths: ['items.dates'],
        },
        // Enable immutability checks only in development
        immutableCheck: process.env.NODE_ENV !== 'production',
      }).concat(leaguesApi.middleware),
    // Enable Redux DevTools only in development
    devTools: process.env.NODE_ENV !== 'production',
  });
};

export type AppStore = ReturnType<typeof makeStore>;

export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 