import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { keywordGroupService } from './keywordGroupService';
import type { KeywordGroup, KeywordGroupDataResponse, CreateKeywordGroupPayload } from './types';

export type KeywordGroupSortField = 'name' | 'status' | 'createdAt' | '';

interface KeywordGroupState {
  items: KeywordGroup[];
  loading: boolean;
  actionLoading: boolean;
  generateAiLoading: boolean;
  deleteLoadingId: string | null;
  statusLoadingId: string | null;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  sortField: KeywordGroupSortField;
  sortOrder: 'asc' | 'desc';
}

const initialState: KeywordGroupState = {
  items: [],
  loading: false,
  actionLoading: false,
  generateAiLoading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  deleteLoadingId: null,
  statusLoadingId: null,
  sortField: '',
  sortOrder: 'desc',
};

export const fetchKeywordGroups = createAsyncThunk(
  'keywordGroups/fetchGroups',
  async ({ domainId, page, limit, sort = '', order = 'desc' as const }: { domainId: string; page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' }, { rejectWithValue }) => {
    try {
      return await keywordGroupService.getGroups(domainId, page, limit, sort, order);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi tải danh sách bộ keywords');
    }
  }
);

export const createKeywordGroup = createAsyncThunk(
  'keywordGroups/createGroup',
  async (payload: CreateKeywordGroupPayload, { rejectWithValue }) => {
    try {
      return await keywordGroupService.createGroup(payload);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi tạo bộ keywords mới');
    }
  }
);

export const suggestAiKeywords = createAsyncThunk(
  'keywordGroups/suggestAiKeywords',
  async ({ domainId, payload }: { domainId: string; payload: import('./types').SuggestAiKeywordsPayload }, { rejectWithValue }) => {
    try {
      return await keywordGroupService.suggestAiKeywords(domainId, payload);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi tạo keywords bằng AI');
    }
  }
);

export const deleteKeywordGroup = createAsyncThunk(
  'keywordGroups/deleteGroup',
  async (id: string, { rejectWithValue }) => {
    try {
      await keywordGroupService.deleteGroup(id);
      return id;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi xóa bộ keywords');
    }
  }
);

export const updateKeywordGroupStatus = createAsyncThunk(
  'keywordGroups/updateStatus',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      await keywordGroupService.updateGroupStatus(id, { status });
      return { id, status };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái keywords');
    }
  }
);

const keywordGroupSlice = createSlice({
  name: 'keywordGroups',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setKeywordSortField: (state, action: { payload: KeywordGroupSortField }) => {
      state.sortField = action.payload;
    },
    setKeywordSortOrder: (state, action: { payload: 'asc' | 'desc' }) => {
      state.sortOrder = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch List
      .addCase(fetchKeywordGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKeywordGroups.fulfilled, (state, action: PayloadAction<KeywordGroupDataResponse>) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.total = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.limit = action.payload.limit || 10;
        state.totalPages = action.payload.totalPages || 0;
      })
      .addCase(fetchKeywordGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createKeywordGroup.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createKeywordGroup.fulfilled, (state, action: PayloadAction<KeywordGroup>) => {
        state.actionLoading = false;
        // Optionally prepend the new item
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createKeywordGroup.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
      // AI Generate
      .addCase(suggestAiKeywords.pending, (state) => {
        state.generateAiLoading = true;
        state.error = null;
      })
      .addCase(suggestAiKeywords.fulfilled, (state) => {
        state.generateAiLoading = false;
      })
      .addCase(suggestAiKeywords.rejected, (state, action) => {
        state.generateAiLoading = false;
        state.error = action.payload as string;
      })
      // Delete
      .addCase(deleteKeywordGroup.pending, (state, action) => {
        state.deleteLoadingId = action.meta.arg;
        state.error = null;
      })
      .addCase(deleteKeywordGroup.fulfilled, (state, action) => {
        state.deleteLoadingId = null;
        state.items = state.items.filter((item) => (item as { _id?: string })._id !== action.payload && item.id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteKeywordGroup.rejected, (state, action) => {
        state.deleteLoadingId = null;
        state.error = action.payload as string;
      })
      // Update Status
      .addCase(updateKeywordGroupStatus.pending, (state, action) => {
        state.statusLoadingId = action.meta.arg.id;
        state.error = null;
      })
      .addCase(updateKeywordGroupStatus.fulfilled, (state, action) => {
        state.statusLoadingId = null;
        const index = state.items.findIndex((item) => (item as { _id?: string })._id === action.payload.id || item.id === action.payload.id);
        if (index !== -1) {
          (state.items[index] as KeywordGroup & { status: string }).status = action.payload.status;
        }
      })
      .addCase(updateKeywordGroupStatus.rejected, (state, action) => {
        state.statusLoadingId = null;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setKeywordSortField, setKeywordSortOrder } = keywordGroupSlice.actions;
export default keywordGroupSlice.reducer;
