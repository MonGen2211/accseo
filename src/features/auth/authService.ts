import type { LoginCredentials, LoginResponse, RegisterCredentials, RegisterResponse, User } from '../../types/auth.types';
import api, { setTokenGetter, setTokenSetter } from '../../utils/api';
import { API_BASE_URL } from '../../utils/constants';

let accessToken: string | null = null;

setTokenGetter(() => accessToken);
setTokenSetter((token) => { accessToken = token; });

// Map raw BE user object (uses _id) → User type (uses id), preserving imgAvatar
const mapRawUser = (raw: Record<string, unknown>): User => ({
  id: (raw._id as string) || (raw.id as string),
  email: raw.email as string,
  name: raw.name as string,
  role: raw.role as User['role'],
  roles: Array.isArray(raw.roles) ? (raw.roles as string[]) : undefined,
  avatar: raw.avatar as string | undefined,
  imgAvatar: raw.imgAvatar as string | undefined,
  createdAt: raw.createdAt as string,
});

// Fetch full user profile by ID — /users/{id} returns imgAvatar, /users/me may not
const fetchFullUser = async (userId: string): Promise<User> => {
  const res = await api.get<{ success: boolean; statusCode: number; data: Record<string, unknown> }>(`/users/${userId}`);
  return mapRawUser(res.data.data);
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    const apiData = response.data;
    const { user, accessToken: token } = apiData.data;

    accessToken = token;

    try {
      const userId = (user as unknown as Record<string, string>)._id || user?.id;
      if (userId) {
        apiData.data.user = await fetchFullUser(userId);
      }
    } catch {
      // fallback to user from login response
    }

    localStorage.setItem('user', JSON.stringify(apiData.data.user));
    return apiData;
  },

  async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', credentials);
    const { statusCode } = response.data;

    if (statusCode === 201) {
      return response.data;
    }
    throw new Error(`Lỗi hệ thống: ${statusCode}`);
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    accessToken = null;
    localStorage.removeItem('user');
  },

  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem('user');
      return stored && stored !== 'undefined' ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  },

  getAccessToken(): string | null {
    return accessToken;
  },

  async bootstrapAuth(): Promise<{ user: User; accessToken: string } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) return null;

      const { data } = await res.json();
      const token = data?.accessToken;

      if (token) {
        accessToken = token;

        let user: User | null = null;
        try {
          // Prefer user ID from refresh response or stored session to call /users/{id}
          // which reliably returns imgAvatar (unlike /users/me which may omit it)
          const storedUser = this.getCurrentUser();
          const userId = data?.user?._id || data?.user?.id || storedUser?.id || (storedUser as unknown as Record<string, string>)?._id;

          if (userId) {
            user = await fetchFullUser(userId);
          } else {
            // Fallback: /users/me
            const meRes = await api.get<{ success: boolean; data: Record<string, unknown> }>('/users/me');
            user = mapRawUser(meRes.data.data);
          }
        } catch {
          // Last resort: merge stored + fresh from refresh response
          const stored = this.getCurrentUser();
          const fresh = data?.user ?? null;
          user = fresh ? { ...stored, ...fresh } as User : (stored ?? fresh);
        }

        if (user) localStorage.setItem('user', JSON.stringify(user));
        return { user: user!, accessToken: token };
      }

      return null;
    } catch {
      return null;
    }
  },
};
