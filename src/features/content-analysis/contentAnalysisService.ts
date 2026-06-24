import api from '../../utils/api';
import type { SessionDetail, HistoryResponse } from './types';

export interface StartSessionParams {
  keyword: string;
  location?: string;
  language?: string;
  topN?: number;
  h2Count?: number;
  h3Count?: number;
  description?: string;
}

export interface ExportDocOptions {
  title: boolean;
  metaInfo: boolean;
  metaDescription: boolean;
  differentiationStrategy: boolean;
  headingNotes: boolean;
  h4: boolean;
  faqs: boolean;
  sources: boolean;
}

export interface StartSessionResponse {
  sessionId: string;
  status: 'queued' | 'done';
  cached: boolean;
  cachedFrom?: string;
}

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
}

export const contentAnalysisService = {
  startSession: async (params: StartSessionParams): Promise<StartSessionResponse> => {
    const res = await api.post<ApiResponse<StartSessionResponse>>('/content-analysis/start', params);
    return res.data.data;
  },

  getSession: async (sessionId: string): Promise<SessionDetail> => {
    const res = await api.get<ApiResponse<SessionDetail>>(`/content-analysis/${sessionId}`);
    return res.data.data;
  },

  getSessionsList: async (limit: number = 20): Promise<HistoryResponse> => {
    const res = await api.get<ApiResponse<HistoryResponse>>(`/content-analysis/list?limit=${limit}`);
    return res.data.data;
  },

  exportDoc: async (
    sessionId: string,
    options?: ExportDocOptions,
    force: boolean = false
  ): Promise<{ docId: string; docUrl: string; editUrl: string; previewUrl: string; cached: boolean }> => {
    const res = await api.post<ApiResponse<{ docId: string; docUrl: string; editUrl: string; previewUrl: string; cached: boolean }>>(
      `/content-analysis/${sessionId}/export-doc${force ? '?force=true' : ''}`,
      { options }
    );
    return res.data.data;
  },

  regenerate: async (
    sessionId: string,
    params: { h2Count?: number; h3Count?: number; description?: string }
  ): Promise<SessionDetail> => {
    const res = await api.post<ApiResponse<SessionDetail>>(`/content-analysis/${sessionId}/regenerate`, params);
    return res.data.data;
  },
};
