import api from '../../utils/api';
import type { GetArticlesParams, GetArticlesResponse, ScraperSummary, TriggerScrapeResponse, ScraperSchedule, ScheduleUpdateResponse } from './types';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string;
}

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
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const response = await api.get<ApiResponse<GetArticlesResponse>>(`/scraper/articles?${query.toString()}`);
    return response.data.data;
  },

  getSummary: async (params?: { source?: string; date?: string }): Promise<ScraperSummary> => {
    const query = new URLSearchParams();
    if (params?.source) query.append('source', params.source);
    if (params?.date) query.append('date', params.date);

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

  aiGenerate: async (id: string, force = false): Promise<{ message: string; cached: boolean; data: any }> => {
    const response = await api.post<ApiResponse<{ message: string; cached: boolean; data: any }>>(
      `/scraper/articles/${id}/ai-generate${force ? '?force=true' : ''}`
    );
    return response.data.data;
  },

  getAiResult: async (id: string): Promise<any | null> => {
    const response = await api.get<ApiResponse<any | null>>(`/scraper/articles/${id}/ai-result`);
    return response.data.data;
  }
};
