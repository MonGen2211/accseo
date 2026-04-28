import api from '../../utils/api';
import type { Ga4OverviewData, Ga4PagesData } from './ga4Types';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDateRange(days: number): { startDate: string; endDate: string; period: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return { startDate: formatDate(start), endDate: formatDate(end), period: `${days}d` };
}

export const ga4Service = {
  async getOverview(domainId: string, days: number): Promise<Ga4OverviewData> {
    const { startDate, endDate, period } = getDateRange(days);
    const response = await api.get<ApiResponse<Ga4OverviewData>>(
      `/ga4/${domainId}/overview?period=${period}&startDate=${startDate}&endDate=${endDate}`
    );
    return response.data.data;
  },

  async getPages(
    domainId: string,
    days: number,
    params: { page?: number; limit?: number; sort?: string; order?: string } = {}
  ): Promise<Ga4PagesData> {
    const { startDate, endDate, period } = getDateRange(days);
    const { page = 1, limit = 10, sort = 'sessions', order = 'desc' } = params;
    const response = await api.get<ApiResponse<Ga4PagesData>>(
      `/ga4/${domainId}/pages?period=${period}&startDate=${startDate}&endDate=${endDate}&sort=${sort}&order=${order}&page=${page}&limit=${limit}`
    );
    return response.data.data;
  },
};
