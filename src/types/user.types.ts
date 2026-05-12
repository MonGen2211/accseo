import type { UserRole } from './auth.types';

export type UserSortField = 'name' | 'email' | 'role' | 'isActive' | 'createdAt' | '';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roles?: string[];
  avatar?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
  companyName?: string;
  branch?: string;
  msnv?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  imgAvatar?: string | null;
  dateOfBirth?: string | null;
}

export interface UserFormData {
  email: string;
  name: string;
  role?: UserRole;
  roles?: string[];
  password?: string;
  status: 'active' | 'inactive';
  companyName?: string;
  branch?: string;
  msnv?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  dateOfBirth?: string | null;
}

export interface UserState {
  users: UserProfile[];
  selectedUser: UserProfile | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  sortField: UserSortField;
  sortOrder: 'asc' | 'desc';
}
