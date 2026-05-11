export type UserRole = 'ADMIN' | 'MAR_SPECIALIST' | 'CONTENT_SPECIALIST' | 'SEO_COLLABORATOR' | 'REVIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roles?: string[];
  avatar?: string;
  imgAvatar?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  initializing: boolean;
  loading: boolean;
  error: string | null;
  allowedPages: string[] | null | undefined; // undefined = not yet fetched; null = admin (all access); string[] = specific pages
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
  roles?: string[];
  companyName?: string;
  branch?: string;
}

export interface RegisterResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: User;
}
