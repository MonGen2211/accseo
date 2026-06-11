import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { activityService } from './activityService';
import type { ActivityLog } from './activityService';

// ─── State ────────────────────────────────────────────────────────────────────
interface ActivityState {
	items: ActivityLog[];
	total: number;
	loading: boolean;
	loadingMore: boolean;
	hasMore: boolean;
	error: string | null;
}

const initialState: ActivityState = {
	items: [],
	total: 0,
	loading: false,
	loadingMore: false,
	hasMore: true,
	error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

// Fetch page 1 — replaces items
export const fetchActivities = createAsyncThunk(
	'activities/fetchAll',
	async (params: { page?: number; limit?: number; success?: boolean } = {}) => {
		return await activityService.getAll(params);
	}
);

// Fetch next page — appends to existing items
export const loadMoreActivities = createAsyncThunk(
	'activities/loadMore',
	async (params: { page: number; limit?: number; success?: boolean }) => {
		await new Promise(r => setTimeout(r, 500));
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
			state.hasMore = true;
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// fetchActivities (reset)
			.addCase(fetchActivities.pending, (state) => {
				if (state.items.length === 0) {
					state.loading = true;
				}
				state.error = null;
			})
			.addCase(fetchActivities.fulfilled, (state, action) => {
				state.loading = false;
				state.items = action.payload.items;
				state.total = action.payload.total;
				state.hasMore = action.payload.items.length < action.payload.total;
			})
			.addCase(fetchActivities.rejected, (state) => {
				state.loading = false;
				state.error = 'Không thể tải lịch sử hoạt động.';
			})

			// loadMoreActivities (append)
			.addCase(loadMoreActivities.pending, (state) => {
				state.loadingMore = true;
			})
			.addCase(loadMoreActivities.fulfilled, (state, action) => {
				state.loadingMore = false;
				state.items = [...state.items, ...action.payload.items];
				state.total = action.payload.total;
				state.hasMore = state.items.length < action.payload.total;
			})
			.addCase(loadMoreActivities.rejected, (state) => {
				state.loadingMore = false;
			});
	},
});

export const { clearActivities } = activitySlice.actions;
export default activitySlice.reducer;
