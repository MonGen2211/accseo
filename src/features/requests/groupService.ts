import api from '../../utils/api';
import type { Group, PaginatedResult } from './types';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
}

export interface GroupFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapGroup = (g: any): Group => ({
  id: g._id || g.id,
  name: g.name,
  description: g.description,
  members: (g.members ?? []).map((m: any) => ({
    id: m._id || m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    isActive: m.isActive,
    imgAvatar: m.imgAvatar,
  })),
  createdBy: g.createdBy ?? { id: '', name: '' },
  isActive: g.isActive ?? true,
  createdAt: g.createdAt,
});

export const groupService = {
  async getAll(params: GroupFilterParams): Promise<PaginatedResult<Group>> {
    const response = await api.get<ApiResponse<unknown>>('/groups', { params });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = response.data.data as any;
    return {
      items: (data.items ?? []).map(mapGroup),
      total: data.total ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? 10,
      totalPages: data.totalPages ?? 1,
    };
  },

  async getById(id: string): Promise<Group> {
    const response = await api.get<ApiResponse<unknown>>(`/groups/${id}`);
    return mapGroup(response.data.data);
  },

  async create(data: { name: string; description?: string; members?: string[] }): Promise<Group> {
    const response = await api.post<ApiResponse<unknown>>('/groups', data);
    return mapGroup(response.data.data);
  },

  async update(id: string, data: { name?: string; description?: string; isActive?: boolean }): Promise<Group> {
    const response = await api.patch<ApiResponse<unknown>>(`/groups/${id}`, data);
    return mapGroup(response.data.data);
  },

  async updateMembers(id: string, members: string[]): Promise<Group> {
    const response = await api.put<ApiResponse<unknown>>(`/groups/${id}/members`, { members });
    return mapGroup(response.data.data);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/groups/${id}`);
  },
};
