import api from '../../utils/api';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ActivityLog {
	id: string;
	name: string;
	userAvatar: string | null;
	message: string;
	createdAt: string;
}

export interface ActivityLogListResult {
	items: ActivityLog[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface ActivityLogParams {
	page?: number;
	limit?: number;
	success?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
interface ApiResponse<T> {
	success: boolean;
	statusCode: number;
	data: T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapItem = (raw: any): ActivityLog => ({
	id: raw._id || raw.id || '',
	name: raw.name ?? raw.userName ?? '',
	userAvatar: raw.userAvatar ?? null,
	message: raw.message ?? '',
	createdAt: raw.createdAt ?? new Date().toISOString(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapList = (data: any): ActivityLogListResult => ({
	items: (data.items ?? []).map(mapItem),
	total: data.total ?? 0,
	page: data.page ?? 1,
	limit: data.limit ?? 10,
	totalPages: data.totalPages ?? 1,
});

// ─── Service ──────────────────────────────────────────────────────────────────
export const activityService = {
	async getAll(params: ActivityLogParams = {}): Promise<ActivityLogListResult> {
		const response = await api.get<ApiResponse<unknown>>('/activity-logs', { params });
		return mapList(response.data.data);
	},
};
