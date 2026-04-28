import api from '../../utils/api';
import type { KeywordGroup, KeywordGroupDataResponse, CreateKeywordGroupPayload } from './types';

// API Response wrapper as seen in other services
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
}

export const keywordGroupService = {
  async getGroups(domainId: string, page = 1, limit = 20, sort = '', order: 'asc' | 'desc' = 'desc'): Promise<KeywordGroupDataResponse> {
    const sortParam = sort ? `&sort=${sort}&order=${order}` : '';
    const response = await api.get<ApiResponse<KeywordGroupDataResponse>>(
      `/keywords/groups?domainId=${domainId}&page=${page}&limit=${limit}${sortParam}`
    );
    return response.data.data;
  },

  async createGroup(payload: CreateKeywordGroupPayload): Promise<KeywordGroup> {
    const response = await api.post<ApiResponse<KeywordGroup>>('/keywords/groups', payload);
    return response.data.data;
  },

  async suggestAiKeywords(domainId: string, payload: import('./types').SuggestAiKeywordsPayload): Promise<unknown> {
    const response = await api.post<ApiResponse<unknown>>(`/keywords/suggest-for-domain/${domainId}/by-keywords`, payload);
    return response.data; // Using unknown as we just trigger the generation and show success
  },

  async deleteGroup(id: string): Promise<{ message: string }> {
    const response = await api.delete<ApiResponse<unknown>>(`/keywords/groups/${id}`);
    return { message: response.data.message || '' };
  },

  async updateGroupStatus(id: string, payload: import('./types').UpdateKeywordGroupPayload): Promise<{ data: unknown; message: string }> {
    const response = await api.patch<ApiResponse<unknown>>(`/keywords/groups/${id}`, payload);
    return { data: response.data.data, message: response.data.message || '' };
  },
};
