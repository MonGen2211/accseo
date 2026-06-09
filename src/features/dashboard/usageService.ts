import api from '../../utils/api';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ActionItem {
  action: string;
  label: string;
  category: string;
  categoryLabel: string;
}

export interface CategoryItem {
  category: string;
  categoryLabel: string;
  actions: string[];
}

export interface ActionsResponse {
  total: number;
  actions: ActionItem[];
  categories: CategoryItem[];
}

export interface TodayStatsItem {
  key: string;
  label?: string;
  name?: string;
  email?: string;
  roles?: string[];
  category?: string;
  categoryLabel?: string;
  runs: number;
  failed: number;
  users: number;
  lastAt: string;
}

export interface TodayStatsResponse {
  date: string;
  totalRuns: number;
  totalFailed: number;
  distinctUsers: number;
  byAction: TodayStatsItem[];
  byUser: TodayStatsItem[];
}

export interface FlexibleStatsFilters {
  from: string;
  to: string;
  action: string[];
  category: string[];
  userId: string[];
  role: string[];
  method: string[];
  outcome: 'all' | 'success' | 'failed';
  groupBy: 'action' | 'user' | 'date' | 'category';
}

export interface StatsGroupItem {
  key: string;
  runs: number;
  failed: number;
  users: number;
  lastAt: string;
  
  // Conditionally present based on groupBy
  label?: string;
  category?: string;
  categoryLabel?: string;
  name?: string;
  email?: string;
  roles?: string[];
}

export interface FlexibleStatsResponse {
  filters: FlexibleStatsFilters;
  totalRuns: number;
  totalFailed: number;
  distinctUsers: number;
  groups: StatsGroupItem[];
}

export interface StatsQueryParams {
  from?: string;
  to?: string;
  action?: string; // CSV
  category?: string; // CSV
  userId?: string; // CSV
  role?: string; // CSV
  method?: string; // CSV
  outcome?: 'all' | 'success' | 'failed';
  groupBy?: 'action' | 'user' | 'date' | 'category';
  sort?: 'runs' | 'failed';
  order?: 'asc' | 'desc';
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────
export const usageService = {
  getActions: async (): Promise<ActionsResponse> => {
    const response = await api.get<ApiResponse<ActionsResponse>>('/usage/actions');
    return response.data.data;
  },

  getTodayStats: async (): Promise<TodayStatsResponse> => {
    const response = await api.get<ApiResponse<TodayStatsResponse>>('/usage/today');
    return response.data.data;
  },

  getStats: async (params: StatsQueryParams = {}): Promise<FlexibleStatsResponse> => {
    // Filter out undefined and empty values
    const queryParams: Record<string, string | number> = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        queryParams[key] = val as string | number;
      }
    });

    const response = await api.get<ApiResponse<FlexibleStatsResponse>>('/usage/stats', {
      params: queryParams,
    });
    return response.data.data;
  },
};

export default usageService;
