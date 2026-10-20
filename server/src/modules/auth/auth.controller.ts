import { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { getRefreshTokenCookieOptions } from '../../utils/token.js';
import { ApiError } from '../../utils/ApiError.js';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body, req.ip);

    res.cookie('rt', result.rawRefreshToken, getRefreshTokenCookieOptions());

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body, req.ip);

    res.cookie('rt', result.rawRefreshToken, getRefreshTokenCookieOptions());

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    });
  }

  async googleAuth(req: Request, res: Response): Promise<void> {
    const result = await authService.googleLogin(req.body.idToken, req.ip);

    res.cookie('rt', result.rawRefreshToken, getRefreshTokenCookieOptions());

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const rawRefreshToken = req.cookies?.rt || req.body?.refreshToken;

    if (!rawRefreshToken) {
      throw ApiError.unauthorized('Refresh token is required in cookie', 'REFRESH_TOKEN_REQUIRED');
    }

    const result = await authService.refresh(rawRefreshToken, req.ip);

    res.cookie('rt', result.rawRefreshToken, getRefreshTokenCookieOptions());

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken
      }
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const rawRefreshToken = req.cookies?.rt;
    const userId = req.user?._id?.toString();

    const result = await authService.logout(rawRefreshToken, userId, req.ip);

    res.clearCookie('rt', {
      path: '/api/v1/auth',
      httpOnly: true,
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      data: result
    });
  }

  async logoutAll(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required', 'UNAUTHENTICATED');
    }

    const userId = req.user._id.toString();
    const result = await authService.logoutAll(userId, req.ip);

    res.clearCookie('rt', {
      path: '/api/v1/auth',
      httpOnly: true,
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      data: result
    });
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required', 'UNAUTHENTICATED');
    }

    const userId = req.user._id.toString();
    const ip = req.ip || req.socket.remoteAddress;
    const result = await authService.changePassword(userId, req.body, ip);

    res.cookie('rt', result.rawRefreshToken, getRefreshTokenCookieOptions());

    res.status(200).json({
      success: true,
      data: {
        message: result.message,
        accessToken: result.accessToken
      }
    });
  }
}

export const authController = new AuthController();
export default authController;
