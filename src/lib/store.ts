import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
// import { apiMiddleware } from './middleware/apiMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    })
    // .concat(apiMiddleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 