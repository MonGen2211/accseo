import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { domainService } from './domainService';
import type { Domain } from '../../types/domain.types';

export type DomainSortField = 'domain' | 'metaDescription' | 'lastCheckedAt' | '';

interface DomainState {
  domains: Domain[];
  loading: boolean;
  createLoading: boolean;
  ownersLoading: boolean;
  actionLoadingId: string | null;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  sortField: DomainSortField;
  sortOrder: 'asc' | 'desc';
}

const initialState: DomainState = {
  domains: [],
  loading: false,
  createLoading: false,
  ownersLoading: false,
  actionLoadingId: null,
  error: null,
  pagination: { page: 1, limit: 10, total: 0 },
  sortField: '',
  sortOrder: 'desc',
};

export const fetchDomains = createAsyncThunk(
  'domains/fetchAll',
  async ({ page = 1, limit = 10, sort = '', order = 'desc' as const }: { page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' } = {}, { rejectWithValue }) => {
    try {
      return await domainService.getAll(page, limit, sort, order);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const createDomain = createAsyncThunk(
  'domains/create',
  async (domain: string, { rejectWithValue }) => {
    try {
      return await domainService.create({ domain });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message = axiosErr.response?.data?.message || (err as Error).message || 'Lỗi khi tạo tên miền';
      return rejectWithValue(message);
    }
  }
);

export const deleteDomain = createAsyncThunk(
  'domains/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await domainService.delete(id);
      return id;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message = axiosErr.response?.data?.message || (err as Error).message || 'Lỗi khi xóa tên miền';
      return rejectWithValue(message);
    }
  }
);

export const checkDomainMeta = createAsyncThunk(
  'domains/checkMeta',
  async (id: string, { rejectWithValue }) => {
    try {
      return await domainService.checkMeta(id);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi kiểm tra meta');
    }
  }
);

export const updateDomainOwners = createAsyncThunk(
  'domains/updateOwners',
  async ({ id, ownerIds }: { id: string; ownerIds: string[] }, { rejectWithValue }) => {
    try {
      return await domainService.updateOwners(id, ownerIds);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi cập nhật người quản lý');
    }
  }
);

const domainSlice = createSlice({
  name: 'domains',
  initialState,
  reducers: {
    clearDomainError: (state) => {
      state.error = null;
    },
    setDomainSortField: (state, action: { payload: DomainSortField }) => {
      state.sortField = action.payload;
    },
    setDomainSortOrder: (state, action: { payload: 'asc' | 'desc' }) => {
      state.sortOrder = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchDomains.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDomains.fulfilled, (state, action) => {
        state.loading = false;
        state.domains = action.payload.items;
        state.pagination.total = action.payload.total;
        state.pagination.page = action.payload.page;
        state.pagination.limit = action.payload.limit;
      })
      .addCase(fetchDomains.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createDomain.pending, (state) => {
        state.error = null;
        state.createLoading = true;
      })
      .addCase(createDomain.fulfilled, (state, action) => {
        state.createLoading = false;
        state.domains.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createDomain.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload as string;
      })
      // Check Meta
      .addCase(checkDomainMeta.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg;
        state.error = null;
      })
      .addCase(checkDomainMeta.fulfilled, (state, action) => {
        state.actionLoadingId = null;
        const index = state.domains.findIndex((d) => d._id === action.meta.arg);
        if (index !== -1) {
          state.domains[index] = { ...state.domains[index], ...action.payload };
        }
      })
      .addCase(checkDomainMeta.rejected, (state, action) => {
        state.actionLoadingId = null;
        state.error = action.payload as string;
      })
      // Delete
      .addCase(deleteDomain.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg;
        state.error = null;
      })
      .addCase(deleteDomain.fulfilled, (state, action) => {
        state.actionLoadingId = null;
        state.domains = state.domains.filter((d) => d._id !== action.payload);
        state.pagination.total -= 1;
      })
      .addCase(deleteDomain.rejected, (state, action) => {
        state.actionLoadingId = null;
        state.error = action.payload as string;
      })
      // Update Owners
      .addCase(updateDomainOwners.pending, (state) => {
        state.ownersLoading = true;
        state.error = null;
      })
      .addCase(updateDomainOwners.fulfilled, (state, action) => {
        state.ownersLoading = false;
        const index = state.domains.findIndex((d) => d._id === action.meta.arg.id);
        if (index !== -1) {
          state.domains[index] = { ...state.domains[index], ...action.payload };
        }
      })
      .addCase(updateDomainOwners.rejected, (state, action) => {
        state.ownersLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDomainError, setDomainSortField, setDomainSortOrder } = domainSlice.actions;

export default domainSlice.reducer;
