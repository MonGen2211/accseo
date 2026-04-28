import type { UserProfile, UserFormData } from '../../types/user.types';
import { authService } from '../auth/authService';
import api from '../../utils/api';

interface ApiUser {
  _id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
}

const mapApiUserToProfile = (user: ApiUser): UserProfile => ({
  id: user._id,
  email: user.email,
  name: user.name,
  role: user.role as UserProfile['role'],
  status: user.isActive ? 'active' : 'inactive',
  createdAt: user.createdAt,
});

export const userService = {
  async getAll(page = 1, limit = 10, search = '', sort = '', order: 'asc' | 'desc' = 'desc'): Promise<{ items: UserProfile[]; total: number; page: number; limit: number; totalPages: number }> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    const sortParam = sort ? `&sort=${sort}&order=${order}` : '';
    const response = await api.get<ApiResponse<PaginatedData<ApiUser>>>(`/users?page=${page}&limit=${limit}${searchParam}${sortParam}`);
    const data = response.data.data;
    return {
      items: data.items.map(mapApiUserToProfile),
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages,
    };
  },

  async getById(id: string): Promise<UserProfile> {
    const response = await api.get<ApiResponse<ApiUser>>(`/users/${id}`);
    return mapApiUserToProfile(response.data.data);
  },

  async create(data: UserFormData): Promise<{ user: UserProfile; message: string }> {
    const response = await authService.register({
      email: data.email,
      name: data.name,
      password: data.password ?? '',
      role: data.role,
    });
    const user = response.data; 
    return {
      user: {
        id: user.id || (user as unknown as { _id: string })._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        status: 'active',
        createdAt: user.createdAt,
      },
      message: response.message,
    };
  },

  async update(id: string, data: Partial<UserFormData>): Promise<UserProfile> {
    const payload: Record<string, unknown> = {};
    if (data.email !== undefined) payload.email = data.email;
    if (data.name !== undefined) payload.name = data.name;
    if (data.role !== undefined) payload.role = data.role;
    if (data.status !== undefined) payload.isActive = data.status === 'active';

    const response = await api.patch<ApiResponse<{ user: ApiUser }>>(`/users/${id}`, payload);
    return mapApiUserToProfile(response.data.data.user);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
