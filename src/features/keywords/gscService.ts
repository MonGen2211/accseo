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
    params: { sort?: string; page?: number; limit?: number } = {}
  ): Promise<GscKeywordsData> {
    const { sort = 'clicks', page = 1, limit = 10 } = params;
    const response = await api.get<ApiResponse<GscKeywordsData>>(
      `/gsc/${domainId}/keywords?sort=${sort}&page=${page}&limit=${limit}`
    );
    return response.data.data;
  },

  async getPages(
    domainId: string,
    params: { sort?: string; page?: number; limit?: number } = {}
  ): Promise<GscPagesData> {
    const { sort = 'clicks', page = 1, limit = 10 } = params;
    const response = await api.get<ApiResponse<GscPagesData>>(
      `/gsc/${domainId}/pages?sort=${sort}&page=${page}&limit=${limit}`
    );
    return response.data.data;
  },
};
