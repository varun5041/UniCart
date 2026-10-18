import { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { AuthService } from './auth.service.js';

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie('rt', token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie('rt', {
    httpOnly: true,
    secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth'
  });
}

export class AuthController {
  static async register(req: Request, res: Response) {
    const user = await AuthService.register(req.body, req.ip);
    res.status(201).json({
      success: true,
      data: user
    });
  }

  static async login(req: Request, res: Response) {
    const { accessToken, refreshToken, user } = await AuthService.login(req.body, {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user
      }
    });
  }

  static async refresh(req: Request, res: Response) {
    const rawToken = req.cookies?.rt;

    try {
      const { accessToken, refreshToken } = await AuthService.refresh(rawToken, {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });

      setRefreshTokenCookie(res, refreshToken);

      res.status(200).json({
        success: true,
        data: {
          accessToken
        }
      });
    } catch (err) {
      clearRefreshTokenCookie(res);
      throw err;
    }
  }

  static async logout(req: Request, res: Response) {
    const rawToken = req.cookies?.rt;
    const actorId = req.user?.id;

    await AuthService.logout(rawToken, actorId, req.ip);
    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  static async logoutAll(req: Request, res: Response) {
    const userId = req.user!.id;

    await AuthService.logoutAll(userId, req.ip);
    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: 'All active sessions invalidated'
    });
  }
}

export default AuthController;
