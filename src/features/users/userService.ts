import type { UserProfile, UserFormData } from '../../types/user.types';
import { authService } from '../auth/authService';
import api from '../../utils/api';

interface ApiUser {
	_id: string;
	email: string;
	name: string;
	role: string;
	roles?: string[];
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	dateOfBirth?: string;
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

const mapApiUserToProfile = (user: ApiUser & { companyName?: string, branch?: string, msnv?: string, phone1?: string, phone2?: string, imgAvatar?: string, dateOfBirth?: string }): UserProfile => ({
	id: user._id,
	email: user.email,
	name: user.name,
	role: user.role as UserProfile['role'],
	roles: user.roles,
	status: user.isActive ? 'active' : 'inactive',
	createdAt: user.createdAt,
	companyName: user.companyName,
	branch: user.branch,
	msnv: user.msnv,
	phone1: user.phone1,
	phone2: user.phone2,
	imgAvatar: user.imgAvatar,
	dateOfBirth: user.dateOfBirth,
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
			roles: data.role ? [data.role] : undefined,
			companyName: data.companyName,
			branch: data.branch,
			msnv: data.msnv || undefined,
			dateOfBirth: data.dateOfBirth || undefined
		});
		const user = response.data;
		return {
			user: {
				id: user.id || (user as unknown as { _id: string })._id,
				email: user.email,
				name: user.name,
				role: (user.role || (user.roles && user.roles[0])) as UserProfile['role'],
				roles: user.roles || (data.role ? [data.role] : []),
				avatar: user.avatar,
				status: 'active',
				createdAt: user.createdAt,
				companyName: data.companyName,
				branch: data.branch,
				msnv: data.msnv,
				dateOfBirth: data.dateOfBirth
			},
			message: response.message,
		};
	},

	async update(id: string, data: Partial<UserFormData>): Promise<UserProfile> {
		const payload: Record<string, unknown> = {};
		if (data.email !== undefined) payload.email = data.email;
		if (data.name !== undefined) payload.name = data.name;
		if (data.roles !== undefined) payload.roles = data.roles;
		if (data.status !== undefined) payload.isActive = data.status === 'active';
		if (data.companyName !== undefined) payload.companyName = data.companyName;
		if (data.branch !== undefined) payload.branch = data.branch;
		if (data.msnv !== undefined) payload.msnv = data.msnv;
		if (data.dateOfBirth !== undefined) payload.dateOfBirth = data.dateOfBirth;

		const response = await api.patch<ApiResponse<{ user: ApiUser }>>(`/users/${id}`, payload);
		return mapApiUserToProfile(response.data.data.user);
	},

	async updateProfile(data: { name?: string; phone1?: string; phone2?: string; imgAvatar?: File; dateOfBirth?: string }): Promise<UserProfile> {
		const formData = new FormData();
		if (data.name !== undefined) formData.append('name', data.name);
		if (data.phone1 !== undefined) formData.append('phone1', data.phone1);
		if (data.phone2 !== undefined) formData.append('phone2', data.phone2);
		if (data.dateOfBirth !== undefined) formData.append('dateOfBirth', data.dateOfBirth);
		if (data.imgAvatar !== undefined) formData.append('imgAvatar', data.imgAvatar);

		const response = await api.patch<ApiResponse<ApiUser | { user: ApiUser }>>('/users/me', formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		// @ts-expect-error - Handle both response formats
		const user = response.data.data.user || response.data.data;
		return mapApiUserToProfile(user as ApiUser);
	},

	async remove(id: string): Promise<void> {
		await api.delete(`/users/${id}`);
	},

	async getAssignable(search = '', includeAdmin = false, role?: string): Promise<UserProfile[]> {
		const params: Record<string, string | boolean> = {};
		if (search) params.search = search;
		if (includeAdmin) params.includeAdmin = true;
		if (role) params.role = role;
		const response = await api.get<ApiResponse<ApiUser[]>>('/users/assignable', { params });
		return (response.data.data ?? []).map(mapApiUserToProfile);
	},

	async changePassword(currentPassword: string, newPassword: string): Promise<void> {
		await api.patch('/users/me/password', { currentPassword, newPassword });
	},

	async resetPassword(id: string, newPassword: string): Promise<void> {
		await api.patch(`/users/${id}/reset-password`, { newPassword });
	},
};
