import crypto from 'node:crypto';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { CookieOptions } from 'express';
import { env } from '../config/env.js';

export interface AccessTokenPayload {
  sub: string;
  role: 'customer' | 'admin';
  tokenVersion: number;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'],
    algorithm: 'HS256'
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ['HS256']
  }) as JwtPayload & AccessTokenPayload;

  return {
    sub: decoded.sub as string,
    role: decoded.role,
    tokenVersion: decoded.tokenVersion
  };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateRefreshToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}

export function getRefreshTokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  };
}
