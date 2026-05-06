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

  async createGroupItems(payload: import('./types').CreateKeywordGroupItemsPayload): Promise<KeywordGroup[]> {
    const response = await api.post<ApiResponse<KeywordGroup[]>>('/keywords/groups', payload);
    return response.data.data;
  },

  async getCategories(): Promise<string[]> {
    const response = await api.get<ApiResponse<{ count: number; items: { category: string }[] }>>('/serpapi/categories');
    return response.data.data.items.map(item => item.category);
  },

  async suggestAiKeywords(domainId: string, payload: import('./types').SuggestAiKeywordsPayload): Promise<import('./types').AiSuggestedKeyword[]> {
    const response = await api.post<ApiResponse<{ source?: string, items: import('./types').AiSuggestedKeyword[] }>>(`/keywords/suggest-for-domain/${domainId}/by-serpapi`, payload);
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

  async clearSuggestionsCache(domainId: string): Promise<void> {
    await api.delete(`/keywords/suggest-for-domain/${domainId}/by-serpapi/cache`);
  },

  async getDashboardStatsByCurrentUser(): Promise<{
    domainTotal: number;
    group: { total: number; pendingApproval: number; notStarted: number; inProgress: number; deployed: number };
    keyword: { total: number; pending: number; approved: number; published: number };
  }> {
    const response = await api.get<ApiResponse<{ overall: {
      domainTotal: number;
      group: { total: number; pendingApproval: number; notStarted: number; inProgress: number; deployed: number };
      keyword: { total: number; pending: number; approved: number; published: number };
    } }>>('/keywords/by-current-user?includeKeywords=false');
    return response.data.data.overall;
  },

  async suggestAiKeywordsByTrendsLive(domainId: string, payload: import('./types').SuggestByTrendsLivePayload): Promise<import('./types').AiSuggestedKeyword[]> {
    const response = await api.post<ApiResponse<{ source?: string, results: import('./types').AiSuggestedKeyword[] }>>(`/keywords/suggest-for-domain/${domainId}/by-trends-live`, payload);
    return response.data.data.results;
  },

  async clearTrendsLiveCache(domainId: string): Promise<void> {
    await api.delete(`/keywords/suggest-for-domain/${domainId}/by-trends-live/cache`);
  },
};
