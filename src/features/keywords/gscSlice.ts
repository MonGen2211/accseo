import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { gscService } from './gscService';
import type {
  GscOverviewData,
  GscKeywordsData,
  GscPagesData,
  GscDateRange,
  GscContentTab,
} from './gscTypes';

export type GscSortField = 'clicks' | 'impressions' | 'ctr' | 'position';

interface GscState {
  overview: GscOverviewData | null;
  keywords: GscKeywordsData | null;
  pages: GscPagesData | null;
  overviewLoading: boolean;
  keywordsLoading: boolean;
  pagesLoading: boolean;
  error: string | null;
  dateRange: GscDateRange;
  activeTab: GscContentTab;
  keywordsSortField: GscSortField;
  keywordsSortOrder: 'asc' | 'desc';
  pagesSortField: GscSortField;
  pagesSortOrder: 'asc' | 'desc';
  keywordsPage: number;
  keywordsLimit: number;
  keywordsTotal: number;
  pagesPage: number;
  pagesLimit: number;
  pagesTotal: number;
}

const initialState: GscState = {
  overview: null,
  keywords: null,
  pages: null,
  overviewLoading: false,
  keywordsLoading: false,
  pagesLoading: false,
  error: null,
  dateRange: 28,
  activeTab: 'overview',
  keywordsSortField: 'clicks',
  keywordsSortOrder: 'desc',
  pagesSortField: 'clicks',
  pagesSortOrder: 'desc',
  keywordsPage: 1,
  keywordsLimit: 10,
  keywordsTotal: 0,
  pagesPage: 1,
  pagesLimit: 10,
  pagesTotal: 0,
};

export const fetchGscOverview = createAsyncThunk(
  'gsc/fetchOverview',
  async ({ domainId, days }: { domainId: string; days: number }, { rejectWithValue }) => {
    try {
      return await gscService.getOverview(domainId, days);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi tải dữ liệu tổng quan GSC');
    }
  }
);

export const fetchGscKeywords = createAsyncThunk(
  'gsc/fetchKeywords',
  async (
    { domainId, sort, order, page, limit }: { domainId: string; sort?: string; order?: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      return await gscService.getKeywords(domainId, { sort, order, page, limit });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi tải danh sách từ khóa GSC');
    }
  }
);

export const fetchGscPages = createAsyncThunk(
  'gsc/fetchPages',
  async (
    { domainId, sort, order, page, limit }: { domainId: string; sort?: string; order?: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      return await gscService.getPages(domainId, { sort, order, page, limit });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi tải danh sách trang GSC');
    }
  }
);

const gscSlice = createSlice({
  name: 'gsc',
  initialState,
  reducers: {
    setDateRange: (state, action: PayloadAction<GscDateRange>) => {
      state.dateRange = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<GscContentTab>) => {
      state.activeTab = action.payload;
    },
    setGscKeywordsSortField: (state, action: PayloadAction<GscSortField>) => {
      state.keywordsSortField = action.payload;
    },
    setGscKeywordsSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.keywordsSortOrder = action.payload;
    },
    setGscPagesSortField: (state, action: PayloadAction<GscSortField>) => {
      state.pagesSortField = action.payload;
    },
    setGscPagesSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.pagesSortOrder = action.payload;
    },
    setGscKeywordsPage: (state, action: PayloadAction<number>) => {
      state.keywordsPage = action.payload;
    },
    setGscPagesPage: (state, action: PayloadAction<number>) => {
      state.pagesPage = action.payload;
    },
    clearGscError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Overview
      .addCase(fetchGscOverview.pending, (state) => {
        state.overviewLoading = true;
        state.error = null;
      })
      .addCase(fetchGscOverview.fulfilled, (state, action: PayloadAction<GscOverviewData>) => {
        state.overviewLoading = false;
        state.overview = action.payload;
      })
      .addCase(fetchGscOverview.rejected, (state, action) => {
        state.overviewLoading = false;
        state.error = action.payload as string;
      })
      // Keywords
      .addCase(fetchGscKeywords.pending, (state) => {
        state.keywordsLoading = true;
        state.error = null;
      })
      .addCase(fetchGscKeywords.fulfilled, (state, action: PayloadAction<GscKeywordsData>) => {
        state.keywordsLoading = false;
        state.keywords = action.payload;
        state.keywordsTotal = action.payload.total ?? action.payload.items.length;
        state.keywordsPage = action.payload.page ?? state.keywordsPage;
        state.keywordsLimit = action.payload.limit ?? state.keywordsLimit;
      })
      .addCase(fetchGscKeywords.rejected, (state, action) => {
        state.keywordsLoading = false;
        state.error = action.payload as string;
      })
      // Pages
      .addCase(fetchGscPages.pending, (state) => {
        state.pagesLoading = true;
        state.error = null;
      })
      .addCase(fetchGscPages.fulfilled, (state, action: PayloadAction<GscPagesData>) => {
        state.pagesLoading = false;
        state.pages = action.payload;
        state.pagesTotal = action.payload.total ?? action.payload.items.length;
        state.pagesPage = action.payload.page ?? state.pagesPage;
        state.pagesLimit = action.payload.limit ?? state.pagesLimit;
      })
      .addCase(fetchGscPages.rejected, (state, action) => {
        state.pagesLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setDateRange,
  setActiveTab,
  setGscKeywordsSortField,
  setGscKeywordsSortOrder,
  setGscPagesSortField,
  setGscPagesSortOrder,
  setGscKeywordsPage,
  setGscPagesPage,
  clearGscError,
} = gscSlice.actions;
export default gscSlice.reducer;
