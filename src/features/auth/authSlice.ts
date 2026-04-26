import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { AuthState, LoginCredentials } from '../../types/auth.types';
import { authService } from './authService';
import { notificationService } from '../notifications/notificationService';
import { resetNotifications } from '../notifications/notificationSlice';

const initialState: AuthState = {
  user: authService.getCurrentUser(),
  accessToken: null,
  isAuthenticated: false,
  initializing: true, // true cho đến khi bootstrapAuth chạy xong
  loading: false,
  error: null,
};

// Khôi phục session từ HttpOnly cookie khi app khởi động
export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  return await authService.bootstrapAuth();
});

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    await notificationService.deleteFcmToken();
    notificationService.disconnectSSE();
    dispatch(resetNotifications());
    await authService.logout();
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Bootstrap auth
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.initializing = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
        } else {
          state.isAuthenticated = false;
          state.user = null;
          state.accessToken = null;
        }
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.initializing = false;
        state.isAuthenticated = false;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.data.user;
        state.accessToken = action.payload.data.accessToken;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
