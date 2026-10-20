import { api } from './client';
import type { ApiResponse, CouponQuote } from '../types';

export const couponsApi = {
  async validate(code: string): Promise<ApiResponse<CouponQuote>> {
    const res = await api.post<ApiResponse<CouponQuote>>('/coupons/validate', { code });
    return res.data;
  }
};
