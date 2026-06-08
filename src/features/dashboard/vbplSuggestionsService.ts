import api from '../../utils/api';
import { API_BASE_URL } from '../../utils/constants';
import { authService } from '../auth/authService';
import type { 
  VbplSuggestionFilters, 
  VbplKeywordsResponse,
  TrendingKeywordsResponse,
  PublicTrendSuggestionsResponse,
  PublicTrendDatesResponse,
  CustomTrendSnapshotResponse,
  CustomTrendPaginationResponse,
  AiExpandKeywordsRequest,
  AiExpandKeywordsResponse,
  AiExpandSnapshotListResponse,
  AiExpandSnapshotDetailResponse
} from './vbplSuggestions.types';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
}

export const vbplSuggestionsService = {
  async getSuggestions(filters?: VbplSuggestionFilters): Promise<VbplKeywordsResponse> {
    const params = new URLSearchParams();
    if (filters?.days !== undefined) params.append('days', String(filters.days));
    if (filters?.limit !== undefined) params.append('limit', String(filters.limit));
    if (filters?.linhVuc) params.append('linhVuc', filters.linhVuc);
    if (filters?.agency) params.append('agency', filters.agency);

    const qs = params.toString();
    const url = `/keyword-suggestions/from-vbpl${qs ? `?${qs}` : ''}`;
    
    const response = await api.get<ApiResponse<VbplKeywordsResponse>>(url);
    return response.data.data;
  },

  async getTrendingKeywords(params: { geo?: string; hours?: number; categoryIds: string }): Promise<TrendingKeywordsResponse> {
    const qsParams = new URLSearchParams();
    if (params.geo) qsParams.append('geo', params.geo);
    if (params.hours !== undefined) qsParams.append('hours', String(params.hours));
    qsParams.append('categoryIds', params.categoryIds);
    
    const response = await api.get<ApiResponse<TrendingKeywordsResponse>>(`/serpapi/trending-keywords-by-categories?${qsParams.toString()}`);
    return response.data.data;
  },

  async getPublicTrendSuggestions(params: { count?: number; timeRange?: string; categoryIds?: string }): Promise<PublicTrendSuggestionsResponse> {
    const response = await api.post<ApiResponse<PublicTrendSuggestionsResponse>>('/keywords/trends/public-suggest', params);
    return response.data.data;
  },

  async getPublicTrendSuggestionsStream(
    payload: { count?: number; timeRange?: string; categoryIds?: string },
    onLog: (event: any) => void,
    onResult: (data: PublicTrendSuggestionsResponse) => void,
    onError: (message: string) => void,
    signal: AbortSignal
  ): Promise<void> {
    const token = authService.getAccessToken();
    const res = await fetch(`${API_BASE_URL}/keywords/trends/public-suggest/stream`, {
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
          const data = JSON.parse(dataStr);
          if (eventType === 'log') onLog(data);
          else if (eventType === 'result') onResult(data);
          else if (eventType === 'error') onError(data.message || 'Đã có lỗi');
        } catch { /* ignore chunk parse errors */ }
      }
    }
  },

  async getPublicTrendDates(): Promise<PublicTrendDatesResponse> {
    const response = await api.get<ApiResponse<PublicTrendDatesResponse>>('/keywords/trends/public-suggest/dates');
    return response.data.data;
  },

  async getPublicTrendByDate(date: string): Promise<PublicTrendSuggestionsResponse> {
    const response = await api.get<ApiResponse<PublicTrendSuggestionsResponse>>(`/keywords/trends/public-suggest/by-date?date=${date}`);
    return response.data.data;
  },

  async getCustomTrendSuggestions(page = 1, limit = 20): Promise<CustomTrendPaginationResponse> {
    const response = await api.get<ApiResponse<CustomTrendPaginationResponse>>(`/keywords/custom-suggest?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  async getCustomTrendSnapshot(id: string): Promise<CustomTrendSnapshotResponse> {
    const response = await api.get<ApiResponse<CustomTrendSnapshotResponse>>(`/keywords/custom-suggest/${id}`);
    return response.data.data;
  },

  async patchCustomTrendSnapshot(id: string, payload: { name?: string; description?: string }): Promise<{ id: string; name: string; baseName: string; description: string }> {
    const response = await api.patch<ApiResponse<{ id: string; name: string; baseName: string; description: string }>>(`/keywords/custom-suggest/${id}`, payload);
    return response.data.data;
  },

  async deleteCustomTrendSnapshot(id: string): Promise<{ id: string; message: string }> {
    const response = await api.delete<ApiResponse<{ id: string; message: string }>>(`/keywords/custom-suggest/${id}`);
    return response.data.data;
  },

  async getCustomTrendSuggestionsStream(
    payload: { name: string; description?: string; inputKeywords: string[]; count?: number; timeRange?: '3-m' | '1-m' },
    onLog: (event: any) => void,
    onResult: (data: CustomTrendSnapshotResponse) => void,
    onError: (message: string) => void,
    signal: AbortSignal
  ): Promise<void> {
    const token = authService.getAccessToken();
    const res = await fetch(`${API_BASE_URL}/keywords/custom-suggest/stream`, {
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
          const data = JSON.parse(dataStr);
          if (eventType === 'log') onLog(data);
          else if (eventType === 'result') onResult(data);
          else if (eventType === 'error') onError(data.message || 'Đã có lỗi');
        } catch { /* ignore chunk parse errors */ }
      }
    }
  },

  async getCustomTrendRegenStream(
    id: string,
    payload: { count?: number; timeRange?: '3-m' | '1-m' },
    onLog: (event: any) => void,
    onResult: (data: CustomTrendSnapshotResponse) => void,
    onError: (message: string) => void,
    signal: AbortSignal
  ): Promise<void> {
    const token = authService.getAccessToken();
    const res = await fetch(`${API_BASE_URL}/keywords/custom-suggest/${id}/regen/stream`, {
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
          const data = JSON.parse(dataStr);
          if (eventType === 'log') onLog(data);
          else if (eventType === 'result') onResult(data);
          else if (eventType === 'error') onError(data.message || 'Đã có lỗi');
        } catch { /* ignore chunk parse errors */ }
      }
    }
  },

  async aiExpandKeywords(payload: AiExpandKeywordsRequest): Promise<AiExpandKeywordsResponse> {
    const response = await api.post<ApiResponse<AiExpandKeywordsResponse>>('/keywords/ai-expand', payload, {
      timeout: 150000 // 150 seconds timeout for long AI + Google Ads processing
    });
    return response.data.data;
  },

  async getAiExpandSnapshots(page: number = 1, limit: number = 20): Promise<AiExpandSnapshotListResponse> {
    const response = await api.get<ApiResponse<AiExpandSnapshotListResponse>>(
      `/keywords/ai-expand/snapshots?page=${page}&limit=${limit}`
    );
    return response.data.data;
  },

  async getAiExpandSnapshotDetail(id: string, page: number = 1, limit: number = 50): Promise<AiExpandSnapshotDetailResponse> {
    const response = await api.get<ApiResponse<AiExpandSnapshotDetailResponse>>(
      `/keywords/ai-expand/snapshots/${id}?page=${page}&limit=${limit}`
    );
    return response.data.data;
  }
};

