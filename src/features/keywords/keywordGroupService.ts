import api from '../../utils/api';
import { API_BASE_URL } from '../../utils/constants';
import { authService } from '../auth/authService';
import type { KeywordGroup, KeywordGroupDataResponse, CreateKeywordGroupPayload, StreamLogEvent, AiSuggestedKeyword, SuggestByGroupsPayload } from './types';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
}

export const keywordGroupService = {
  async getGroups(domainId: string, page = 1, limit = 20, sort = '', order: 'asc' | 'desc' = 'desc', status = '', search = ''): Promise<KeywordGroupDataResponse> {
    const sortParam = sort ? `&sort=${sort}&order=${order}` : '';
    const statusParam = status ? `&status=${status}` : '';
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    const response = await api.get<ApiResponse<KeywordGroupDataResponse>>(
      `/keywords/groups?domainId=${domainId}&page=${page}&limit=${limit}${sortParam}${statusParam}${searchParam}`
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

  async suggestKeywordsByGroups(payload: import('./types').SuggestByGroupsPayload): Promise<import('./types').AiSuggestedKeyword[]> {
    const response = await api.post<ApiResponse<{ suggestions: import('./types').AiSuggestedKeyword[] }>>('/keywords/groups/suggest', payload);
    return response.data.data.suggestions;
  },

  async getGroupById(id: string): Promise<{
    group: KeywordGroup;
    keywords: { items: Array<{ _id: string; value: string; status: string; isAiGenerated: boolean }>; total: number; page: number; limit: number; totalPages: number };
  }> {
    const response = await api.get<ApiResponse<{
      group: KeywordGroup;
      keywords: { items: Array<{ _id: string; value: string; status: string; isAiGenerated: boolean }>; total: number; page: number; limit: number; totalPages: number };
    }>>(`/keywords/groups/${id}`);
    return response.data.data;
  },

  async approveGroup(id: string, reason?: string, silent = false): Promise<KeywordGroup> {
    const url = `/keywords/groups/${id}/approve${silent ? '?silent=true' : ''}`;
    const response = await api.post<ApiResponse<{ message: string; group: KeywordGroup }>>(url, reason ? { reason } : {});
    return response.data.data.group;
  },

  async rejectGroup(id: string, reason?: string, silent = false): Promise<KeywordGroup> {
    const url = `/keywords/groups/${id}/reject${silent ? '?silent=true' : ''}`;
    const response = await api.post<ApiResponse<{ message: string; group: KeywordGroup }>>(url, reason ? { reason } : {});
    return response.data.data.group;
  },

  async clearGroupsSuggestCache(domainId: string): Promise<void> {
    await api.delete(`/keywords/groups/suggest/cache/${domainId}`);
  },

  async suggestKeywordsByGroupsStream(
    payload: SuggestByGroupsPayload,
    onLog: (event: StreamLogEvent) => void,
    onResult: (suggestions: AiSuggestedKeyword[]) => void,
    onError: (message: string) => void,
    signal: AbortSignal,
  ): Promise<void> {
    const token = authService.getAccessToken();
    const res = await fetch(`${API_BASE_URL}/keywords/groups/suggest/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      onError(err.message || `Lỗi ${res.status}`);
      return;
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        let eventType = 'message';
        let dataStr = '';
        for (const line of part.split('\n')) {
          if (line.startsWith('event: ')) eventType = line.slice(7).trim();
          else if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
        }
        if (!dataStr) continue;
        try {
          const data = JSON.parse(dataStr) as StreamLogEvent & { suggestions?: AiSuggestedKeyword[]; code?: string };
          if (eventType === 'log') onLog(data as StreamLogEvent);
          else if (eventType === 'result') onResult(data.suggestions ?? []);
          else if (eventType === 'error') onError(data.message || 'Đã có lỗi');
        } catch { /* bỏ qua chunk lỗi parse */ }
      }
    }
  },
};
