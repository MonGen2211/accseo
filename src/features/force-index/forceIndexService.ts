import api from '../../utils/api';
import type {
  ForceIndexStats,
  ForceIndexListResponse,
  ForceIndexVisitsResponse,
  ForceIndexStatusResponse,
  ForceIndexSubmitResponse,
} from './types';

export const forceIndexService = {
  getStats: async (): Promise<ForceIndexStats> => {
    const res = await api.get<any>('/force-index/stats');
    return res.data.data;
  },

  getList: async (limit = 200): Promise<ForceIndexListResponse> => {
    const res = await api.get<any>(`/force-index/list?limit=${limit}`);
    return res.data.data;
  },

  getVisits: async (params: {
    hashId?: string;
    isGooglebot?: string; // "true" | "false" | ""
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<ForceIndexVisitsResponse> => {
    const query = new URLSearchParams();
    if (params.hashId) query.append('hashId', params.hashId);
    if (params.isGooglebot) query.append('isGooglebot', params.isGooglebot);
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const res = await api.get<any>(`/force-index/visits?${query.toString()}`);
    return res.data.data;
  },

  getStatus: async (hashId: string): Promise<ForceIndexStatusResponse> => {
    const res = await api.get<any>(`/force-index/status?hashId=${hashId}`);
    return res.data.data;
  },

  submitUrl: async (url: string): Promise<ForceIndexSubmitResponse> => {
    const res = await api.post<any>('/indexing/submit', { url });
    return res.data.data;
  },
};
