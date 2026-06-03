import api from '../../utils/api';
import type {
  IndexBoosterSubmitResponse,
  IndexBoosterHistoryResponse,
  IndexBoosterQuotaResponse,
  CheckIndexResponse,
} from './types';

export const indexBoosterService = {
  submitUrls: async (urls: string[], topic?: string): Promise<IndexBoosterSubmitResponse> => {
    const res = await api.post<any>('/index-booster/submit', {
      urls,
      ...(topic ? { topic } : {}),
    });
    return res.data.data;
  },

  getHistory: async (limit: number = 20): Promise<IndexBoosterHistoryResponse> => {
    const res = await api.get<any>(`/index-booster/history?limit=${limit}`);
    return res.data.data;
  },

  getQuotaStatus: async (): Promise<IndexBoosterQuotaResponse> => {
    const res = await api.get<any>('/index-booster/quota-status');
    return res.data.data;
  },

  checkIndex: async (urls: string[], engine: 'local' | 'apify' = 'apify'): Promise<CheckIndexResponse> => {
    const res = await api.post<any>('/serp/check-index', {
      urls,
      engine,
    });
    return res.data.data;
  },
};
