import api from '@/utils/api';
import type { SeoReport, SeoAuditHistoryResponse } from './types';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
}

export const seoAuditService = {
  runAudit: async (url: string): Promise<SeoReport> => {
    // Audit API can take 5 to 35 seconds. Client timeout is set high.
    const res = await api.post<ApiResponse<SeoReport>>('/seo-audit', { url });
    return res.data.data;
  },

  getHistory: async (page = 1, limit = 20): Promise<SeoAuditHistoryResponse> => {
    const res = await api.get<ApiResponse<SeoAuditHistoryResponse>>(`/seo-audit?page=${page}&limit=${limit}`);
    return res.data.data;
  },

  getAuditDetail: async (id: string): Promise<SeoReport> => {
    const res = await api.get<ApiResponse<SeoReport>>(`/seo-audit/${id}`);
    return res.data.data;
  },
};
