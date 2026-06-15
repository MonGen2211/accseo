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
    page?: number;
    limit?: number;
  }): Promise<GetTopicsResponse> {
    const query = new URLSearchParams();
    if (params?.groupId) query.append('groupId', params.groupId);
    if (params?.sourceType) query.append('sourceType', params.sourceType);
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
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
  }
};
