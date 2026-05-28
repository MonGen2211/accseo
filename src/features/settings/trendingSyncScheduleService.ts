import api from '../../utils/api';
import type { TrendingSyncSchedule, CreateTrendingSyncScheduleDto, UpdateTrendingSyncScheduleDto } from './trendingSyncSchedule.types';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
}

export const trendingSyncScheduleService = {
  getAll: async () => {
    const response = await api.get<ApiResponse<{ count: number; items: TrendingSyncSchedule[] }>>(
      '/serpapi/sync-schedules'
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<TrendingSyncSchedule>>(
      `/serpapi/sync-schedules/${id}`
    );
    return response.data;
  },

  create: async (dto: CreateTrendingSyncScheduleDto) => {
    const response = await api.post<ApiResponse<TrendingSyncSchedule>>(
      '/serpapi/sync-schedules',
      dto
    );
    return response.data;
  },

  update: async (id: string, dto: UpdateTrendingSyncScheduleDto) => {
    const response = await api.patch<ApiResponse<TrendingSyncSchedule>>(
      `/serpapi/sync-schedules/${id}`,
      dto
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<{ id: string }>>(
      `/serpapi/sync-schedules/${id}`
    );
    return response.data;
  },

  runNow: async (id: string) => {
    const response = await api.post<ApiResponse<{ id: string }>>(
      `/serpapi/sync-schedules/${id}/run-now`
    );
    return response.data;
  }
};
