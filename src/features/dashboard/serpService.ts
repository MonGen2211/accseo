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
  }
};
