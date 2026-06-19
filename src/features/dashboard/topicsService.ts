import api from '../../utils/api';
import type { 
  AggregatedTopicGroup, 
  GetTopicsResponse, 
  ImportSheetResult, 
  GenerateTopicsResult 
} from './vbplSuggestions.types';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
}

const unwrapResponseData = <T>(resData: any): T => {
  if (resData && typeof resData === 'object' && 'data' in resData && !Array.isArray(resData)) {
    return resData.data as T;
  }
  return resData as T;
};

export const topicsService = {
  async getGroups(): Promise<AggregatedTopicGroup[]> {
    const response = await api.get<ApiResponse<any>>('/topics/groups');
    return unwrapResponseData<AggregatedTopicGroup[]>(response.data.data);
  },

  async getTopics(params?: {
    groupId?: string;
    sourceType?: 'manual' | 'ai_generated';
    search?: string;
    status?: 'pending' | 'approved';
    minVolume?: number;
    sortVolume?: 'desc' | 'asc';
    page?: number;
    limit?: number;
  }): Promise<GetTopicsResponse> {
    const query = new URLSearchParams();
    if (params?.groupId) query.append('groupId', params.groupId);
    if (params?.sourceType) query.append('sourceType', params.sourceType);
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.minVolume !== undefined) query.append('minVolume', String(params.minVolume));
    if (params?.sortVolume) query.append('sortVolume', params.sortVolume);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const response = await api.get<ApiResponse<any>>(`/topics?${query.toString()}`);
    return unwrapResponseData<GetTopicsResponse>(response.data.data);
  },

  async importFromSheet(name: string, sheetUrl: string): Promise<ImportSheetResult> {
    const response = await api.post<ApiResponse<any>>('/topics/import-from-sheet', { name, sheetUrl });
    return unwrapResponseData<ImportSheetResult>(response.data.data);
  },

  async generateTopics(items: { groupId: string; count: number }[]): Promise<GenerateTopicsResult & { message?: string }> {
    const response = await api.post<ApiResponse<any>>('/topics/generate', { items });
    const data = unwrapResponseData<GenerateTopicsResult>(response.data.data);
    return {
      ...data,
      message: response.data.message
    };
  },

  async approveTopics(ids: string[]): Promise<{ approved: number; message?: string }> {
    const response = await api.post<ApiResponse<any>>('/topics/approve', { ids });
    const data = unwrapResponseData<{ approved: number }>(response.data.data);
    return {
      ...data,
      message: response.data.message
    };
  },

  async exportTopicsToSheet(): Promise<{ exported: number; url: string | null; sheetUrl: string | null; message?: string }> {
    const response = await api.post<ApiResponse<any>>('/topics/export-to-sheet');
    const data = unwrapResponseData<{ exported: number; url: string | null; sheetUrl: string | null }>(response.data.data);
    return {
      ...data,
      message: response.data.message
    };
  },

  async getImportSources(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    items: ImportSheetResult[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);

    const response = await api.get<ApiResponse<any>>(`/topics/import-sources?${query.toString()}`);
    return unwrapResponseData<any>(response.data.data);
  },

  // ================= MẢNG (GROUP) =================
  async createGroup(name: string): Promise<AggregatedTopicGroup> {
    const response = await api.post<ApiResponse<any>>('/topics/groups', { name });
    return unwrapResponseData<AggregatedTopicGroup>(response.data.data);
  },

  async updateGroup(id: string, name: string): Promise<AggregatedTopicGroup> {
    const response = await api.patch<ApiResponse<any>>(`/topics/groups/${id}`, { name });
    return unwrapResponseData<AggregatedTopicGroup>(response.data.data);
  },

  async deleteGroup(id: string): Promise<{ deleted: boolean }> {
    const response = await api.delete<ApiResponse<any>>(`/topics/groups/${id}`);
    return unwrapResponseData<{ deleted: boolean }>(response.data.data);
  },

  async refreshGroupVolume(id: string): Promise<{ id: string; name: string; volume: number }> {
    const response = await api.post<ApiResponse<any>>(`/topics/groups/${id}/refresh-volume`);
    return unwrapResponseData<{ id: string; name: string; volume: number }>(response.data.data);
  },

  async refreshGroupsVolume(ids: string[]): Promise<{ updated: number }> {
    const response = await api.post<ApiResponse<any>>('/topics/groups/refresh-volume', { ids });
    return unwrapResponseData<{ updated: number }>(response.data.data);
  },

  // ================= CHỦ ĐỀ (TOPIC) =================
  async createTopic(name: string, groupId: string, volume?: number, seedKeywords?: { keyword: string; volume?: number }[]): Promise<Topic> {
    const response = await api.post<ApiResponse<any>>('/topics', { name, groupId, volume, seedKeywords });
    return unwrapResponseData<Topic>(response.data.data);
  },

  async updateTopic(id: string, data: { name?: string; groupId?: string; volume?: number }): Promise<Topic> {
    const response = await api.patch<ApiResponse<any>>(`/topics/${id}`, data);
    return unwrapResponseData<Topic>(response.data.data);
  },

  async deleteTopic(id: string): Promise<{ deleted: boolean }> {
    const response = await api.delete<ApiResponse<any>>(`/topics/${id}`);
    return unwrapResponseData<{ deleted: boolean }>(response.data.data);
  },

  async refreshTopicVolume(id: string): Promise<{ id: string; name: string; volume: number }> {
    const response = await api.post<ApiResponse<any>>(`/topics/${id}/refresh-volume`);
    return unwrapResponseData<{ id: string; name: string; volume: number }>(response.data.data);
  },

  async refreshTopicsVolume(ids: string[]): Promise<{ updated: number }> {
    const response = await api.post<ApiResponse<any>>('/topics/refresh-volume', { ids });
    return unwrapResponseData<{ updated: number }>(response.data.data);
  },

  // ================= TỪ KHOÁ CON (KEYWORD) =================
  async addKeyword(topicId: string, keyword: string, volume?: number): Promise<Topic> {
    const response = await api.post<ApiResponse<any>>(`/topics/${topicId}/keywords`, { keyword, volume });
    return unwrapResponseData<Topic>(response.data.data);
  },

  async updateKeyword(topicId: string, keywordId: string, data: { keyword?: string; volume?: number }): Promise<Topic> {
    const response = await api.patch<ApiResponse<any>>(`/topics/${topicId}/keywords/${keywordId}`, data);
    return unwrapResponseData<Topic>(response.data.data);
  },

  async deleteKeyword(topicId: string, keywordId: string): Promise<Topic> {
    const response = await api.delete<ApiResponse<any>>(`/topics/${topicId}/keywords/${keywordId}`);
    return unwrapResponseData<Topic>(response.data.data);
  },

  async refreshKeywordVolume(topicId: string, keywordId: string): Promise<{ id: string; keyword: string; volume: number }> {
    const response = await api.post<ApiResponse<any>>(`/topics/${topicId}/keywords/${keywordId}/refresh-volume`);
    return unwrapResponseData<{ id: string; keyword: string; volume: number }>(response.data.data);
  },

  async refreshAllKeywordsVolume(topicId: string): Promise<Topic> {
    const response = await api.post<ApiResponse<any>>(`/topics/${topicId}/keywords/refresh-volume`);
    return unwrapResponseData<Topic>(response.data.data);
  }
};
