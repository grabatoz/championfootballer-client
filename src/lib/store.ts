import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import leagueReducer from './features/leagueSlice';
import matchReducer from './features/matchSlice';
import userReducer from './features/userSlice';
import profileReducer from './features/profileSlice';
import playerStatsReducer from './features/playerStatsSlice';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
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
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      })
      // .concat(apiMiddleware)
  });
};

export type AppStore = ReturnType<typeof makeStore>;

export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 