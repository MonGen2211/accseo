import api from '../../utils/api';
import type { KeywordGroup, KeywordGroupDataResponse, CreateKeywordGroupPayload } from './types';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
}

export const keywordGroupService = {
  async getGroups(domainId: string, page = 1, limit = 20, sort = '', order: 'asc' | 'desc' = 'desc', status = ''): Promise<KeywordGroupDataResponse> {
    const sortParam = sort ? `&sort=${sort}&order=${order}` : '';
    const statusParam = status ? `&status=${status}` : '';
    const response = await api.get<ApiResponse<KeywordGroupDataResponse>>(
      `/keywords/groups?domainId=${domainId}&page=${page}&limit=${limit}${sortParam}${statusParam}`
    );
    return response.data.data;
  },

  async createGroup(payload: CreateKeywordGroupPayload): Promise<KeywordGroup[]> {
    const response = await api.post<ApiResponse<KeywordGroup[]>>('/keywords/groups', payload);
    return response.data.data;
  },

  async suggestAiKeywords(domainId: string, payload: import('./types').SuggestAiKeywordsPayload): Promise<import('./types').AiSuggestedKeyword[]> {
    const response = await api.post<ApiResponse<{ source?: string, items: import('./types').AiSuggestedKeyword[] }>>(`/keywords/suggest-for-domain/${domainId}/by-keywords`, payload);
    return response.data.data.items;
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
