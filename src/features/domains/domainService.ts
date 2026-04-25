import api from '../../utils/api';
import type { Domain } from '../../types/domain.types';

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
export const domainService = {
  async getAll(page = 1, limit = 10): Promise<{ items: Domain[]; total: number; page: number; limit: number; totalPages: number }> {
    const response = await api.get<ApiResponse<PaginatedData<Domain> | Domain[]>>(`/domains?page=${page}&limit=${limit}`);
    const data = response.data.data;
    
    // Xử lý linh hoạt: backend trả về Array (không có wrapper phân trang) hoặc bọc trong { items, total }
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length, // Vì không có total từ server nên fallback là số lượng array
        page,
        limit,
        totalPages: 1
      };
    }

    return {
      items: data.items,
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages,
    };
  },

async create(payload: { domain: string }): Promise<Domain> {
    const response = await api.post('/domains', payload);
    return response.data.data.domain as Domain;
},

  async checkMeta(id: string): Promise<Domain> {
    const response = await api.patch<ApiResponse<Domain>>(`/domains/${id}/check`);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/domains/${id}`);
  }
};
