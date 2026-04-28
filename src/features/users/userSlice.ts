import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { UserState, UserFormData, UserSortField } from '../../types/user.types';
import { userService } from './userService';

const initialState: UserState = {
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0 },
  sortField: '',
  sortOrder: 'desc',
};

export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async ({ page = 1, limit = 10, search = '', sort = '', order = 'desc' as const }: { page?: number; limit?: number; search?: string; sort?: string; order?: 'asc' | 'desc' } = {}, { rejectWithValue }) => {
    try {
      return await userService.getAll(page, limit, search, sort, order);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const createUser = createAsyncThunk(
  'users/create',
  async (data: UserFormData, { rejectWithValue }) => {
    try {
      const result = await userService.create(data);
      return { user: result.user, message: result.message };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi tạo người dùng');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, data }: { id: string; data: Partial<UserFormData> }, { rejectWithValue }) => {
    try {
      return await userService.update(id, data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi cập nhật người dùng');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await userService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setSelectedUser(state, action) {
      state.selectedUser = action.payload;
    },
    clearSelectedUser(state) {
      state.selectedUser = null;
    },
    clearUserError(state) {
      state.error = null;
    },
    setSortField(state, action: { payload: UserSortField }) {
      state.sortField = action.payload;
    },
    setSortOrder(state, action: { payload: 'asc' | 'desc' }) {
      state.sortOrder = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.items;
        state.pagination.total = action.payload.total;
        state.pagination.page = action.payload.page;
        state.pagination.limit = action.payload.limit;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.unshift(action.payload.user);
        state.pagination.total += 1;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const idx = state.users.findIndex((u) => u.id === action.meta.arg.id);
        if (idx !== -1) state.users[idx] = { ...state.users[idx], ...action.payload };
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
        state.pagination.total -= 1;
      });
  },
});

export const { setSelectedUser, clearSelectedUser, clearUserError, setSortField, setSortOrder } = userSlice.actions;
export default userSlice.reducer;
