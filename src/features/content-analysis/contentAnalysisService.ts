import api from '../../utils/api';
import type { SessionDetail, HistoryResponse } from './types';

export interface StartSessionParams {
  keyword: string;
  location?: string;
  language?: string;
  topN?: number;
}

export interface StartSessionResponse {
  sessionId: string;
  status: 'queued' | 'done';
  cached: boolean;
  cachedFrom?: string;
}

export const contentAnalysisService = {
  startSession: async (params: StartSessionParams): Promise<StartSessionResponse> => {
    const res = await api.post<any>('/content-analysis/start', params);
    return res.data.data;
  },

  getSession: async (sessionId: string): Promise<SessionDetail> => {
    const res = await api.get<any>(`/content-analysis/${sessionId}`);
    return res.data.data;
  },

  getSessionsList: async (limit: number = 20): Promise<HistoryResponse> => {
    const res = await api.get<any>(`/content-analysis/list?limit=${limit}`);
    return res.data.data;
  },

  exportDoc: async (sessionId: string, force: boolean = false): Promise<{ docId: string; docUrl: string; cached: boolean }> => {
    const res = await api.post<any>(`/content-analysis/${sessionId}/export-doc${force ? '?force=true' : ''}`);
    return res.data.data;
  },
};
