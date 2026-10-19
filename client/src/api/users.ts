import { api } from './client';
import type { ApiResponse, User, Address } from '../types';

export const usersApi = {
  async getMe(): Promise<ApiResponse<User>> {
    const res = await api.get<ApiResponse<User>>('/users/me');
    return res.data;
  },

  async updateMe(data: { name?: string; addresses?: Address[] }): Promise<ApiResponse<User>> {
    const res = await api.patch<ApiResponse<User>>('/users/me', data);
    return res.data;
  }
};
