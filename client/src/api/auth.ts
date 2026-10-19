import { api, setAccessToken } from './client';
import type { ApiResponse, User } from '../types';

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export const authApi = {
  async register(data: { name: string; email: string; password: string }): Promise<ApiResponse<User>> {
    const res = await api.post<ApiResponse<User>>('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }): Promise<ApiResponse<LoginResponse>> {
    const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
    if (res.data.success && res.data.data?.accessToken) {
      setAccessToken(res.data.data.accessToken);
    }
    return res.data;
  },

  async googleLogin(idToken: string): Promise<ApiResponse<LoginResponse>> {
    const res = await api.post<ApiResponse<LoginResponse>>('/auth/google', { idToken });
    if (res.data.success && res.data.data?.accessToken) {
      setAccessToken(res.data.data.accessToken);
    }
    return res.data;
  },

  async refresh(): Promise<ApiResponse<{ accessToken: string; user?: User }>> {
    const res = await api.post<ApiResponse<{ accessToken: string; user?: User }>>('/auth/refresh');
    if (res.data.success && res.data.data?.accessToken) {
      setAccessToken(res.data.data.accessToken);
    }
    return res.data;
  },

  async logout(): Promise<ApiResponse<null>> {
    try {
      const res = await api.post<ApiResponse<null>>('/auth/logout');
      return res.data;
    } finally {
      setAccessToken(null);
    }
  },

  async logoutAll(): Promise<ApiResponse<null>> {
    try {
      const res = await api.post<ApiResponse<null>>('/auth/logout-all');
      return res.data;
    } finally {
      setAccessToken(null);
    }
  }
};
