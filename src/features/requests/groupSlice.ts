import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { groupService } from './groupService';
import type { GroupState } from './types';
import type { GroupFilterParams } from './groupService';

const initialState: GroupState = {
  items: [],
  current: null,
  loading: false,
  actionLoading: false,
  total: 0,
  totalPages: 1,
  error: null,
};

export const fetchGroups = createAsyncThunk('groups/fetchAll', async (params: GroupFilterParams, { rejectWithValue }) => {
  try {
    return await groupService.getAll(params);
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(e.response?.data?.message ?? 'Lỗi tải groups');
  }
});

export const fetchGroupById = createAsyncThunk('groups/fetchById', async (id: string, { rejectWithValue }) => {
  try {
    return await groupService.getById(id);
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(e.response?.data?.message ?? 'Lỗi tải group');
  }
});

export const createGroup = createAsyncThunk('groups/create', async (data: { name: string; description?: string; members?: string[] }, { rejectWithValue }) => {
  try {
    return await groupService.create(data);
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(e.response?.data?.message ?? 'Lỗi tạo group');
  }
});

export const updateGroup = createAsyncThunk('groups/update', async ({ id, data }: { id: string; data: { name?: string; description?: string; isActive?: boolean } }, { rejectWithValue }) => {
  try {
    return await groupService.update(id, data);
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(e.response?.data?.message ?? 'Lỗi cập nhật group');
  }
});

export const updateGroupMembers = createAsyncThunk('groups/updateMembers', async ({ id, members }: { id: string; members: string[] }, { rejectWithValue }) => {
  try {
    return await groupService.updateMembers(id, members);
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(e.response?.data?.message ?? 'Lỗi cập nhật thành viên');
  }
});

export const deleteGroup = createAsyncThunk('groups/delete', async (id: string, { rejectWithValue }) => {
  try {
    await groupService.remove(id);
    return id;
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(e.response?.data?.message ?? 'Lỗi xoá group');
  }
});

const groupSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    clearCurrentGroup(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroups.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchGroups.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(fetchGroupById.pending, (state) => { state.loading = true; })
      .addCase(fetchGroupById.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(fetchGroupById.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(createGroup.pending, (state) => { state.actionLoading = true; })
      .addCase(createGroup.fulfilled, (state, action) => { state.actionLoading = false; state.items.unshift(action.payload); state.total += 1; })
      .addCase(createGroup.rejected, (state) => { state.actionLoading = false; })

      .addCase(updateGroup.pending, (state) => { state.actionLoading = true; })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.items.findIndex((g) => g.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.current?.id === action.payload.id) state.current = action.payload;
      })
      .addCase(updateGroup.rejected, (state) => { state.actionLoading = false; })

      .addCase(updateGroupMembers.pending, (state) => { state.actionLoading = true; })
      .addCase(updateGroupMembers.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (state.current?.id === action.payload.id) state.current = action.payload;
      })
      .addCase(updateGroupMembers.rejected, (state) => { state.actionLoading = false; })

      .addCase(deleteGroup.pending, (state) => { state.actionLoading = true; })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = state.items.filter((g) => g.id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteGroup.rejected, (state) => { state.actionLoading = false; });
  },
});

export const { clearCurrentGroup } = groupSlice.actions;
export default groupSlice.reducer;
