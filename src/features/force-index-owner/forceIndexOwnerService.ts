import api from '../../utils/api';
import type { DirectSubmitResponse, DirectHistoryResponse } from './types';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
}

export const forceIndexOwnerService = {
  getOwnedDomains: async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<{ domains: string[] }>>('/force-index/owned-domains');
    return response.data.data?.domains || [];
  },

  submitDirect: async (domain: string, urls: string[]): Promise<DirectSubmitResponse> => {
    const response = await api.post<ApiResponse<DirectSubmitResponse>>('/force-index/submit-direct', { domain, urls });
    return response.data.data;
  },

  getDirectHistory: async (limit = 50): Promise<DirectHistoryResponse> => {
    const response = await api.get<ApiResponse<DirectHistoryResponse>>(`/force-index/direct/list?limit=${limit}`);
    return response.data.data;
  }
};
