import api from '../../utils/api';
import type { GetArticlesParams, GetArticlesResponse, ScraperSummary, TriggerScrapeResponse, ScraperSchedule, ScheduleUpdateResponse, AiGenerateResponseData, AiResultResponseData, VbplAiAutoConfig, VbplAiAutoFilterOptions, VbplAiAutoRunResult, ScraperHealthResponse, ScraperHistoryResponse } from './types';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string;
}

const unwrapResponseData = <T>(resData: any): T => {
  if (resData && typeof resData === 'object' && 'data' in resData && !Array.isArray(resData)) {
    return resData.data as T;
  }
  return resData as T;
};

export const scraperService = {
  triggerManualScrape: async (source?: string): Promise<TriggerScrapeResponse> => {
    const response = await api.post<ApiResponse<TriggerScrapeResponse>>('/scraper/run', { source });
    return response.data.data;
  },

  getArticles: async (params: GetArticlesParams): Promise<GetArticlesResponse> => {
    const query = new URLSearchParams();
    if (params.source) query.append('source', params.source);
    if (params.section) query.append('section', params.section);
    if (params.tag) query.append('tag', params.tag);
    if (params.date) query.append('date', params.date);
    if (params.q) query.append('q', params.q);
    if (params.onlyNew) query.append('onlyNew', 'true');
    if (params.scope) query.append('scope', params.scope);
    if (params.effStatusCode) query.append('effStatusCode', params.effStatusCode);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.nganh) query.append('nganh', params.nganh);
    if (params.linhVuc) query.append('linhVuc', params.linhVuc);
    if (params.docTypeCode) query.append('docTypeCode', params.docTypeCode);
    if (params.sheetStatus) query.append('sheetStatus', params.sheetStatus);
    if (params.fullInfoStatus) query.append('fullInfoStatus', params.fullInfoStatus);
    if (params.articleType) query.append('articleType', params.articleType);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const response = await api.get<ApiResponse<GetArticlesResponse>>(`/scraper/articles?${query.toString()}`);
    return response.data.data;
  },

  getSummary: async (params?: { source?: string; date?: string; articleType?: string }): Promise<ScraperSummary> => {
    const query = new URLSearchParams();
    if (params?.source) query.append('source', params.source);
    if (params?.date) query.append('date', params.date);
    if (params?.articleType) query.append('articleType', params.articleType);

    const response = await api.get<ApiResponse<ScraperSummary>>(`/scraper/articles/summary?${query.toString()}`);
    return response.data.data;
  },

  getTags: async (params?: { source?: string }): Promise<{ tags: string[]; categories: string[] }> => {
    const query = new URLSearchParams();
    if (params?.source) query.append('source', params.source);

    const response = await api.get<ApiResponse<{ tags: string[]; categories: string[] }>>(`/scraper/articles/tags?${query.toString()}`);
    return response.data.data;
  },

  getSchedule: async (): Promise<ScraperSchedule> => {
    const response = await api.get<ApiResponse<ScraperSchedule>>('/scraper/schedule');
    return response.data.data;
  },

  updateSchedule: async (cron: string): Promise<ScheduleUpdateResponse> => {
    const response = await api.put<ApiResponse<ScheduleUpdateResponse>>('/scraper/schedule', { cron });
    return response.data.data;
  },

  deleteSchedule: async (): Promise<{ message: string }> => {
    const response = await api.delete<ApiResponse<{ message: string }>>('/scraper/schedule');
    return response.data.data;
  },

  aiGenerate: async (id: string, force = false): Promise<AiGenerateResponseData> => {
    const response = await api.post<ApiResponse<AiGenerateResponseData>>(
      `/scraper/articles/${id}/ai-generate?force=${force}`
    );
    return response.data.data;
  },

  getAiResult: async (id: string): Promise<AiResultResponseData | null> => {
    const response = await api.get<ApiResponse<{ data: AiResultResponseData | null }>>(`/scraper/articles/${id}/ai-result`);
    return response.data.data.data;
  },

  resetAiState: async (source?: string, articleId?: string): Promise<{ message: string; matched: number; modified: number }> => {
    const query = new URLSearchParams();
    if (source) query.append('source', source);
    if (articleId) query.append('articleId', articleId);
    const response = await api.delete<ApiResponse<{ message: string; matched: number; modified: number }>>(
      `/scraper/articles/ai-state?${query.toString()}`
    );
    return response.data.data;
  },

  getVbplAiAutoConfig: async (): Promise<VbplAiAutoConfig> => {
    const response = await api.get<ApiResponse<any>>('/scraper/vbpl/ai-auto-config');
    return unwrapResponseData<VbplAiAutoConfig>(response.data.data);
  },

  updateVbplAiAutoConfig: async (payload: Partial<VbplAiAutoConfig>): Promise<{ message: string; data: VbplAiAutoConfig }> => {
    const response = await api.put<ApiResponse<any>>('/scraper/vbpl/ai-auto-config', payload);
    const responseData = response.data.data;
    // Defensive check: if NestJS global interceptor does NOT unwrap nested { message, data },
    // then responseData has data and message. Otherwise, responseData is the config itself,
    // and response.data.message has the message.
    if (responseData && responseData.data && typeof responseData.message === 'string') {
      return {
        message: responseData.message,
        data: responseData.data as VbplAiAutoConfig
      };
    }
    return {
      message: response.data.message || 'Cập nhật cấu hình tự động đẩy thông tin VBPL lên Sheet thành công!',
      data: responseData as VbplAiAutoConfig
    };
  },

  getVbplAiAutoFilterOptions: async (): Promise<VbplAiAutoFilterOptions> => {
    const response = await api.get<ApiResponse<any>>('/scraper/vbpl/ai-auto-config/filter-options');
    return unwrapResponseData<VbplAiAutoFilterOptions>(response.data.data);
  },

  runVbplAiAutoNow: async (payload?: {
    scopes?: ('TW' | 'DP')[];
    effStatusCodes?: string[];
    docTypeCodes?: string[];
    nganhs?: string[];
    linhVucs?: string[];
  }): Promise<{ message: string; data: { started: boolean } }> => {
    const response = await api.post<ApiResponse<any>>('/scraper/vbpl/ai-auto-config/run-now', payload);
    const responseData = response.data.data;
    if (responseData && responseData.data && typeof responseData.message === 'string') {
      return {
        message: responseData.message,
        data: responseData.data
      };
    }
    return {
      message: response.data.message || 'Kích hoạt tự động đẩy VBPL lên Sheet thành công!',
      data: responseData
    };
  },

  getHealth: async (): Promise<ScraperHealthResponse> => {
    const response = await api.get<ApiResponse<ScraperHealthResponse>>('/scraper/health');
    return response.data.data;
  },

  getHealthRuns: async (
    source: string,
    params: { limit?: number; anomaliesOnly?: boolean }
  ): Promise<ScraperHistoryResponse> => {
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.append('limit', params.limit.toString());
    if (params.anomaliesOnly !== undefined) query.append('anomaliesOnly', String(params.anomaliesOnly));

    const response = await api.get<ApiResponse<ScraperHistoryResponse>>(
      `/scraper/health/${source}/runs?${query.toString()}`
    );
    return response.data.data;
  }
};
