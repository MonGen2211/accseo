import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { AuthState, LoginCredentials } from '../../types/auth.types';
import { authService } from './authService';
import { notificationService } from '../notifications/notificationService';
import { resetNotifications } from '../notifications/notificationSlice';
import api from '../../utils/api';

const initialState: AuthState = {
  user: authService.getCurrentUser(),
  accessToken: null,
  isAuthenticated: false,
  initializing: true,
  loading: false,
  error: null,
  allowedPages: undefined,
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

export const fetchRolePermissions = createAsyncThunk(
  'auth/fetchRolePermissions',
  async (_, { getState }) => {
    const { auth } = getState() as { auth: AuthState };
    if (!auth.user) return ['dashboard'];

    // Collect all roles the user has (prefer roles[] array, fallback to single role)
    const userRoles: string[] = auth.user.roles?.length
      ? auth.user.roles
      : [auth.user.role];

    // ADMIN always gets full access regardless of other roles
    if (userRoles.includes('ADMIN')) return null;

    try {
      // Fetch permissions for every role in parallel, then union all allowed pages
      const results = await Promise.all(
        userRoles.map((role) =>
          api.get<{ data: { pages: string[] } | null }>(`/role-permissions/${role}`)
            .then((res) => res.data.data?.pages ?? [])
            .catch(() => [] as string[])
        )
      );

      const merged = [...new Set(results.flat())];
      return merged.length ? merged : ['dashboard'];
    } catch {
      return ['dashboard'];
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
    updateAuthUser(state, action: { payload: Partial<import('../../types/auth.types').User> }) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
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
      // Role permissions
      .addCase(fetchRolePermissions.fulfilled, (state, action) => {
        state.allowedPages = action.payload;
      })
      .addCase(fetchRolePermissions.rejected, (state) => {
        state.allowedPages = ['dashboard'];
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.allowedPages = undefined;
      });
  },
});

export const { clearError, updateAuthUser } = authSlice.actions;
export default authSlice.reducer;
