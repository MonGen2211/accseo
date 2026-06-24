import api from '../../utils/api';

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
}

export interface SerpCheckPayload {
  keyword: string;
  domain: string;
  competitors?: string[];
  geo?: string;
  hl?: string;
}

export interface SerpBatchCheckPayload {
  keywords: string[];
  domain: string;
  competitors?: string[];
  topN?: number;
  concurrency?: number;
  geo?: string;
  hl?: string;
  mode?: 'fast' | 'slow' | 'apify';
}

export interface CheckIndexPayload {
  urls: string[];
  geo?: string;
  hl?: string;
  minDelayMs?: number;
  maxDelayMs?: number;
  engine?: 'local' | 'apify';
}

export const serpService = {
  checkRank: async (payload: SerpCheckPayload) => {
    const response = await api.post<ApiResponse<any>>('/serp/check', payload, {
      timeout: 120000 // 120 seconds timeout specifically for this request
    });
    return response.data;
  },

  batchCheck: async (payload: SerpBatchCheckPayload) => {
    const response = await api.post<ApiResponse<any>>('/serp/batch-check', payload, {
      timeout: 900000 // 900 seconds (15 minutes) timeout to fully accommodate slow mode with large batch keywords and pagination
    });
    return response.data;
  },

  getCookieStatus: async () => {
    const response = await api.get<ApiResponse<{ fresh: boolean }>>('/serp/cookie-status');
    return response.data;
  },

  refreshCookie: async () => {
    const response = await api.post<ApiResponse<{ ok: boolean; cookies?: number; error?: string }>>('/serp/refresh-cookie');
    return response.data;
  },

  checkIndex: async (payload: CheckIndexPayload) => {
    const response = await api.post<ApiResponse<any>>('/serp/check-index', payload, {
      timeout: 900000 // 15 minutes timeout specifically for batch index check
    });
    return response.data;
  },

  checkAiOverview: async (payload: AiOverviewPayload) => {
    const response = await api.post<ApiResponse<AiOverviewResponseData>>('/serp/ai-overview', payload, {
      timeout: 300000 // Client timeout 5 minutes (300 seconds) for batch processing
    });
    return response.data;
  }
};

export interface AiOverviewPayload {
  keywords: string[];
  domain?: string;
  geo?: 'vn' | 'us';
  hl?: 'vi' | 'en';
}

export interface AiOverviewSource {
  position: number;
  url: string;
  domain: string;
  title: string;
}

export interface AiOverviewItemResult {
  keyword: string;
  domain: string | null;
  geo: string;
  hl: string;
  present: boolean;
  blocked: boolean;
  error: string | null;
  sources: AiOverviewSource[];
  targetCited: boolean;
  targetPosition: number | null;
  scrapedAt: string;
}

export interface AiOverviewResponseData {
  geo: string;
  hl: string;
  domain: string | null;
  total: number;
  present: number;
  blocked: number;
  tookMs: number;
  results: AiOverviewItemResult[];
}
