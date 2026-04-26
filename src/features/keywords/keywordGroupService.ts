import api from '../../utils/api';
import type { KeywordGroup, KeywordGroupDataResponse, CreateKeywordGroupPayload } from './types';

// API Response wrapper as seen in other services
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
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
    const response = await api.post<ApiResponse<unknown>>(`/keywords/suggest-for-domain/${domainId}`, payload);
    return response.data; // Using unknown as we just trigger the generation and show success
  },

  async deleteGroup(id: string): Promise<void> {
    await api.delete(`/keywords/groups/${id}`);
  },

  async updateGroupStatus(id: string, payload: import('./types').UpdateKeywordGroupPayload): Promise<unknown> {
    const response = await api.patch<ApiResponse<unknown>>(`/keywords/groups/${id}`, payload);
    return response.data.data;
  },
};
