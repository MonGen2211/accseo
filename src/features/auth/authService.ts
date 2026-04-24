import type { LoginCredentials, LoginResponse, RegisterCredentials, RegisterResponse, User } from '../../types/auth.types';
import api, { setTokenGetter, setTokenSetter } from '../../utils/api';
import { API_BASE_URL } from '../../utils/constants';

let accessToken: string | null = null;

setTokenGetter(() => accessToken);
setTokenSetter((token) => { accessToken = token; });

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    const apiData = response.data;
    const { user, accessToken: token } = apiData.data;

    accessToken = token;
    localStorage.setItem('user', JSON.stringify(user));

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

  /**
   * Gọi khi app khởi động để khôi phục session từ HttpOnly cookie.
   * Nếu cookie hợp lệ → lấy lại accessToken + user, giữ đăng nhập.
   * Nếu không → trả null (chưa login hoặc hết hạn).
   */
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
        const user = data?.user || this.getCurrentUser();
        if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
        return { user, accessToken: token };
      }

      return null;
    } catch {
      return null;
    }
  },
};
