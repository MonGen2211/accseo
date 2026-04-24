import type { UserRole } from './auth.types';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

export interface UserFormData {
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  status: 'active' | 'inactive';
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
}
