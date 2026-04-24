export type UserRole = 'ADMIN' | 'MAR_SPECIALIST' | 'CONTENT_SPECIALIST' | 'SEO_COLLABORATOR' | 'REVIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  initializing: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginResponse {
  success: boolean;
  statusCode: number;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterCredentials {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}

export interface RegisterResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: User;
}
