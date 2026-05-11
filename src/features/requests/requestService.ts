import api from '../../utils/api';
import type { Request, AuditLog, CreateRequestPayload, ResolvePayload, ReassignPayload, PaginatedResult } from './types';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
}

export interface RequestFilterParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  priority?: string;
  search?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapUser = (u: any) => {
  if (!u) return null;
  if (typeof u === 'string') return { id: u, name: '', email: '', imgAvatar: undefined };
  return { ...u, id: u._id || u.id };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapRequest = (r: any): Request => ({
  id: r._id || r.id,
  title: r.title,
  description: r.description,
  type: r.type,
  priority: r.priority,
  status: r.status,
  assignmentType: r.assignmentType,
  fromUser: mapUser(r.fromUser)!,
  toUser: mapUser(r.toUser),
  toRole: r.toRole ?? null,
  toGroup: r.toGroup ? { ...r.toGroup, id: r.toGroup._id || r.toGroup.id } : null,
  claimedBy: mapUser(r.claimedBy),
  splitMode: r.splitMode ?? false,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participants: (r.participants ?? []).map((p: any) => ({ ...p, user: mapUser(p.user)! })),
  dueDate: r.dueDate ?? null,
  reminders: r.reminders ?? [],
  completionNote: r.completionNote ?? null,
  refType: r.refType ?? null,
  refId: r.refId ?? null,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapPaginated = (data: any): PaginatedResult<Request> => ({
  items: (data.items ?? []).map(mapRequest),
  total: data.total ?? 0,
  page: data.page ?? 1,
  limit: data.limit ?? 10,
  totalPages: data.totalPages ?? 1,
});

export const requestService = {
  async getInbox(params: RequestFilterParams): Promise<PaginatedResult<Request>> {
    const response = await api.get<ApiResponse<unknown>>('/requests/inbox', { params });
    return mapPaginated(response.data.data);
  },

  async getOutbox(params: RequestFilterParams): Promise<PaginatedResult<Request>> {
    const response = await api.get<ApiResponse<unknown>>('/requests/outbox', { params });
    return mapPaginated(response.data.data);
  },

  async getById(id: string): Promise<Request> {
    const response = await api.get<ApiResponse<unknown>>(`/requests/${id}`);
    return mapRequest(response.data.data);
  },

  async getAuditLogs(id: string): Promise<AuditLog[]> {
    const response = await api.get<ApiResponse<AuditLog[]>>(`/requests/${id}/audit-logs`);
    return response.data.data ?? [];
  },

  async create(data: CreateRequestPayload): Promise<Request> {
    const response = await api.post<ApiResponse<unknown>>('/requests', data);
    return mapRequest(response.data.data);
  },

  async claim(id: string): Promise<Request> {
    const response = await api.post<ApiResponse<unknown>>(`/requests/${id}/claim`);
    return mapRequest(response.data.data);
  },

  async resolve(id: string, data: ResolvePayload): Promise<Request> {
    const response = await api.post<ApiResponse<unknown>>(`/requests/${id}/resolve`, data);
    return mapRequest(response.data.data);
  },

  async cancel(id: string): Promise<Request> {
    const response = await api.post<ApiResponse<unknown>>(`/requests/${id}/cancel`);
    return mapRequest(response.data.data);
  },

  async reassign(id: string, data: ReassignPayload): Promise<Request> {
    const response = await api.patch<ApiResponse<unknown>>(`/requests/${id}/reassign`, data);
    return mapRequest(response.data.data);
  },
};
