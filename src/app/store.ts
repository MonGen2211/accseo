import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import authReducer from '../features/auth/authSlice';
import userReducer from '../features/users/userSlice';
import domainReducer from '../features/domains/domainSlice';
import keywordGroupReducer from '../features/keywords/keywordGroupSlice';
import gscReducer from '../features/keywords/gscSlice';
import ga4Reducer from '../features/keywords/ga4Slice';
import notificationReducer from '../features/notifications/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    domains: domainReducer,
    keywordGroups: keywordGroupReducer,
    gsc: gscReducer,
    ga4: ga4Reducer,
    notifications: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
