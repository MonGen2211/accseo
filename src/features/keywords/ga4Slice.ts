import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { ga4Service } from './ga4Service';
import type {
  Ga4OverviewData,
  Ga4PagesData,
  Ga4DateRange,
  Ga4ContentTab,
  Ga4SortField,
} from './ga4Types';

interface Ga4State {
  overview: Ga4OverviewData | null;
  pages: Ga4PagesData | null;
  overviewLoading: boolean;
  pagesLoading: boolean;
  error: string | null;
  dateRange: Ga4DateRange;
  activeTab: Ga4ContentTab;
  pagesPage: number;
  pagesLimit: number;
  pagesTotal: number;
  sortField: Ga4SortField;
}

const initialState: Ga4State = {
  overview: null,
  pages: null,
  overviewLoading: false,
  pagesLoading: false,
  error: null,
  dateRange: 28,
  activeTab: 'overview',
  pagesPage: 1,
  pagesLimit: 10,
  pagesTotal: 0,
  sortField: 'sessions',
};

export const fetchGa4Overview = createAsyncThunk(
  'ga4/fetchOverview',
  async ({ domainId, days }: { domainId: string; days: number }, { rejectWithValue }) => {
    try {
      return await ga4Service.getOverview(domainId, days);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi tải dữ liệu tổng quan GA4');
    }
  }
);

export const fetchGa4Pages = createAsyncThunk(
  'ga4/fetchPages',
  async (
    { domainId, days, page, limit, sort }: {
      domainId: string;
      days: number;
      page?: number;
      limit?: number;
      sort?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      return await ga4Service.getPages(domainId, days, { page, limit, sort });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi tải danh sách trang GA4');
    }
  }
);

const ga4Slice = createSlice({
  name: 'ga4',
  initialState,
  reducers: {
    setGa4DateRange: (state, action: PayloadAction<Ga4DateRange>) => {
      state.dateRange = action.payload;
    },
    setGa4ActiveTab: (state, action: PayloadAction<Ga4ContentTab>) => {
      state.activeTab = action.payload;
    },
    setGa4SortField: (state, action: PayloadAction<Ga4SortField>) => {
      state.sortField = action.payload;
    },
    setGa4PagesPage: (state, action: PayloadAction<number>) => {
      state.pagesPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Overview
      .addCase(fetchGa4Overview.pending, (state) => {
        state.overviewLoading = true;
        state.error = null;
      })
      .addCase(fetchGa4Overview.fulfilled, (state, action: PayloadAction<Ga4OverviewData>) => {
        state.overviewLoading = false;
        state.overview = action.payload;
      })
      .addCase(fetchGa4Overview.rejected, (state, action) => {
        state.overviewLoading = false;
        state.error = action.payload as string;
      })
      // Pages
      .addCase(fetchGa4Pages.pending, (state) => {
        state.pagesLoading = true;
        state.error = null;
      })
      .addCase(fetchGa4Pages.fulfilled, (state, action: PayloadAction<Ga4PagesData>) => {
        state.pagesLoading = false;
        state.pages = action.payload;
        state.pagesTotal = action.payload.total ?? action.payload.items.length;
        state.pagesPage = action.payload.page ?? state.pagesPage;
        state.pagesLimit = action.payload.limit ?? state.pagesLimit;
      })
      .addCase(fetchGa4Pages.rejected, (state, action) => {
        state.pagesLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setGa4DateRange, setGa4ActiveTab, setGa4SortField, setGa4PagesPage } = ga4Slice.actions;
export default ga4Slice.reducer;
