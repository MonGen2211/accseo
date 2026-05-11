import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { activityService } from './activityService';
import type { ActivityLog } from './activityService';

// ─── State ────────────────────────────────────────────────────────────────────
interface ActivityState {
  items: ActivityLog[];
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: ActivityState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
};

// ─── Thunk ────────────────────────────────────────────────────────────────────
export const fetchActivities = createAsyncThunk(
  'activities/fetchAll',
  async (params: { page?: number; limit?: number; success?: boolean } = {}) => {
    return await activityService.getAll(params);
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const activitySlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    clearActivities(state) {
      state.items = [];
      state.total = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchActivities.rejected, (state) => {
        state.loading = false;
        state.error = 'Không thể tải lịch sử hoạt động.';
      });
  },
});

export const { clearActivities } = activitySlice.actions;
export default activitySlice.reducer;
