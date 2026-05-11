import api from '../../utils/api';

export interface Role {
  _id: string;
  name: string;
  label: string;
  description?: string;
  isSystem?: boolean;
}

export interface CreateRoleDto {
  name: string;
  label: string;
  description?: string;
}

export interface UpdateRoleDto {
  label?: string;
  description?: string;
}

export const roleService = {
  async getAll(): Promise<Role[]> {
    const res = await api.get<{ data: Role[] | { items: Role[] } }>('/roles');
    const data = res.data.data;
    return Array.isArray(data) ? data : (data as { items: Role[] }).items ?? [];
  },

  async create(dto: CreateRoleDto): Promise<Role> {
    const res = await api.post<{ data: Role }>('/roles', dto);
    return res.data.data;
  },

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const res = await api.patch<{ data: Role }>(`/roles/${id}`, dto);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/roles/${id}`);
  },

};
