import api from '../../utils/api';
import type { GscOverviewData, GscKeywordsData, GscPagesData } from './gscTypes';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDateRange(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

export const gscService = {
  async getOverview(domainId: string, days: number): Promise<GscOverviewData> {
    const { startDate, endDate } = getDateRange(days);
    const response = await api.get<ApiResponse<GscOverviewData>>(
      `/gsc/${domainId}/overview?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data.data;
  },

  async getKeywords(
    domainId: string,
    params: { sort?: string; order?: string; page?: number; limit?: number; days?: number } = {}
  ): Promise<GscKeywordsData> {
    const { sort = 'clicks', order = 'desc', page = 1, limit = 10, days = 28 } = params;
    const { startDate, endDate } = getDateRange(days);
    const response = await api.get<ApiResponse<GscKeywordsData>>(
      `/gsc/${domainId}/keywords?startDate=${startDate}&endDate=${endDate}&sort=${sort}&order=${order}&page=${page}&limit=${limit}`
    );
    return response.data.data;
  },

  async getPages(
    domainId: string,
    params: { sort?: string; order?: string; page?: number; limit?: number; days?: number } = {}
  ): Promise<GscPagesData> {
    const { sort = 'clicks', order = 'desc', page = 1, limit = 10, days = 28 } = params;
    const { startDate, endDate } = getDateRange(days);
    const response = await api.get<ApiResponse<GscPagesData>>(
      `/gsc/${domainId}/pages?startDate=${startDate}&endDate=${endDate}&sort=${sort}&order=${order}&page=${page}&limit=${limit}`
    );
    return response.data.data;
  },

  async updateSchedule(domainId: string, payload: { enabled: boolean; hour: number }): Promise<{ enabled: boolean; hour: number }> {
    const response = await api.patch<ApiResponse<{ message: string; gscSyncSchedule: { enabled: boolean; hour: number } }>>(
      `/gsc/${domainId}/schedule`,
      payload
    );
    return response.data.data.gscSyncSchedule;
  },

  async syncGsc(domainId: string): Promise<{ message: string; status: string }> {
    const response = await api.post<ApiResponse<{ message: string; status: string }>>(
      `/gsc/${domainId}/sync`
    );
    return response.data.data;
  },

  async getSyncStatus(domainId: string): Promise<any> {
    const response = await api.get<ApiResponse<any>>(
      `/gsc/${domainId}/sync/status`
    );
    return response.data.data;
  },
};
