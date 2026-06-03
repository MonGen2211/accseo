import api from '../../utils/api';
import type {
  LinkHubStats,
  LinkHubListResponse,
  LinkHubStatusResponse,
  LinkHubSubmitResponse,
  CheckIndexResponse,
} from './types';

export const forceIndexV2Service = {
  submitUrls: async (urls: string[], topic?: string): Promise<LinkHubSubmitResponse> => {
    const res = await api.post<any>('/link-hub/submit', {
      urls,
      ...(topic ? { topic } : {}),
    });
    return res.data.data;
  },

  getList: async (limit = 50): Promise<LinkHubListResponse> => {
    const res = await api.get<any>(`/link-hub/list?limit=${limit}`);
    return res.data.data;
  },

  getStatus: async (slug: string): Promise<LinkHubStatusResponse> => {
    const res = await api.get<any>(`/link-hub/status?slug=${slug}`);
    return res.data.data;
  },

  getStats: async (): Promise<LinkHubStats> => {
    const res = await api.get<any>('/link-hub/stats');
    return res.data.data;
  },

  checkIndex: async (params: {
    slugs?: string[];
    limit?: number;
    engine?: 'local' | 'apify';
  }): Promise<CheckIndexResponse> => {
    const res = await api.post<any>('/link-hub/check-index', params);
    return res.data.data;
  },
};
