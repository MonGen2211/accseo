import api from '../../utils/api';
import type { AuditResult, SeoAuditHistoryResponse } from './types';

export const seoAuditService = {
  runAudit: async (url: string): Promise<AuditResult> => {
    // Audit API can take up to 45 seconds, axios timeout is set to 360s, so it is safe.
    const res = await api.post<any>('/seo-audit', { url });
    return res.data.data;
  },

  getHistory: async (page = 1, limit = 20): Promise<SeoAuditHistoryResponse> => {
    const res = await api.get<any>(`/seo-audit?page=${page}&limit=${limit}`);
    return res.data.data;
  },

  getAuditDetail: async (id: string): Promise<AuditResult> => {
    const res = await api.get<any>(`/seo-audit/${id}`);
    return res.data.data;
  },
};
