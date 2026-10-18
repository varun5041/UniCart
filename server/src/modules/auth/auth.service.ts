import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env.js';
import { User, IUser } from '../../models/User.js';
import { RefreshToken } from '../../models/RefreshToken.js';
import { AuditLog } from '../../models/AuditLog.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { RegisterInput, LoginInput } from './auth.schema.js';
import { sendWelcomeEmail } from '../../jobs/queue.js';
import { logger } from '../../config/logger.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'customer' | 'admin';
  };
}

export class AuthService {
  /**
   * Registers a new customer account.
   */
  static async register(input: RegisterInput, ip?: string) {
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw ApiError.conflict('An account with this email address already exists', 'EMAIL_ALREADY_IN_USE');
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await User.create({
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: 'customer'
    });

    await AuditLog.create({
      actorId: user._id,
      action: 'auth.register',
      target: user.email,
      ip: ip || null
    });

    // Enqueue welcome email in background worker queue
    try {
      await sendWelcomeEmail({
        email: user.email,
        name: user.name
      });
    } catch (jobErr) {
      logger.warn({ msg: '[Auth] Could not enqueue welcome email', err: jobErr });
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };
  }

  /**
   * Authenticates user credentials, enforces account lockout rules,
   * generates JWT access token and rotates/issues refresh token.
   */
  static async login(
    input: LoginInput,
    meta: { ip?: string; userAgent?: string }
  ): Promise<AuthTokens> {
    const user = await User.findOne({ email: input.email }).select(
      '+password +failedLogins +lockUntil +tokenVersion'
    );

    if (!user) {
      await AuditLog.create({
        action: 'auth.login.failed',
        target: input.email,
        ip: meta.ip || null,
        meta: { reason: 'User not found' }
      });
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // 1. Check account lockout state
    const now = new Date();
    if (user.lockUntil && user.lockUntil > now) {
      await AuditLog.create({
        actorId: user._id,
        action: 'auth.login.locked',
        target: user.email,
        ip: meta.ip || null
      });
      throw ApiError.unauthorized(
        'Account is temporarily locked due to multiple failed login attempts. Please try again after 15 minutes.',
        'ACCOUNT_LOCKED'
      );
    }

    // Lockout period expired: reset counter
    if (user.lockUntil && user.lockUntil <= now) {
      user.failedLogins = 0;
      user.lockUntil = null;
    }

    // 2. Validate password
    const isPasswordValid = await comparePassword(input.password, user.password || '');
    if (!isPasswordValid) {
      user.failedLogins = (user.failedLogins || 0) + 1;

      // Lock account after 5 consecutive failures
      if (user.failedLogins >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
        await AuditLog.create({
          actorId: user._id,
          action: 'auth.lockout',
          target: user.email,
          ip: meta.ip || null,
          meta: { attempts: user.failedLogins }
        });
      }

      await user.save();

      await AuditLog.create({
        actorId: user._id,
        action: 'auth.login.failed',
        target: user.email,
        ip: meta.ip || null,
        meta: { attempts: user.failedLogins }
      });

      if (user.failedLogins >= 5) {
        throw ApiError.unauthorized(
          'Account is temporarily locked due to multiple failed login attempts. Please try again after 15 minutes.',
          'ACCOUNT_LOCKED'
        );
      }

      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Successful login: reset failed counters
    user.failedLogins = 0;
    user.lockUntil = null;
    await user.save();

    // 3. Issue Token Pair
    const accessToken = AuthService.generateAccessToken(user);
    const { rawToken, tokenHash } = AuthService.generateRefreshTokenPair();
    const familyId = uuidv4();

    await RefreshToken.create({
      tokenHash,
      userId: user._id,
      familyId,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
      ip: meta.ip,
      userAgent: meta.userAgent
    });

    await AuditLog.create({
      actorId: user._id,
      action: 'auth.login.success',
      target: user.email,
      ip: meta.ip || null
    });

    return {
      accessToken,
      refreshToken: rawToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  /**
   * Refreshes access token with full refresh token rotation.
   * If a revoked token is presented, detects reuse and invalidates the entire token family.
   */
  static async refresh(
    rawRefreshToken: string | undefined,
    meta: { ip?: string; userAgent?: string }
  ) {
    if (!rawRefreshToken) {
      throw ApiError.unauthorized('Refresh token is required', 'REFRESH_TOKEN_REQUIRED');
    }

    const tokenHash = AuthService.hashToken(rawRefreshToken);
    const tokenDoc = await RefreshToken.findOne({ tokenHash });

    if (!tokenDoc) {
      await AuditLog.create({
        action: 'auth.refresh.failed',
        target: null,
        ip: meta.ip || null,
        meta: { reason: 'Token hash not found in store' }
      });
      throw ApiError.unauthorized('Invalid or unknown refresh token', 'INVALID_REFRESH_TOKEN');
    }

    // REUSE DETECTION: If this token was already revoked, someone is reusing an old token!
    if (tokenDoc.revokedAt !== null) {
      // Invalidate the entire family
      await RefreshToken.updateMany(
        { familyId: tokenDoc.familyId, revokedAt: null },
        { revokedAt: new Date() }
      );

      // Invalidate all active access tokens for this user
      await User.findByIdAndUpdate(tokenDoc.userId, { $inc: { tokenVersion: 1 } });

      await AuditLog.create({
        actorId: tokenDoc.userId,
        action: 'auth.refresh.reuse',
        target: tokenDoc.familyId,
        ip: meta.ip || null,
        meta: {
          warning: 'Refresh token reuse detected. Family revoked and tokenVersion bumped.'
        }
      });

      throw ApiError.unauthorized(
        'Token reuse detected. All active sessions have been invalidated for security.',
        'TOKEN_REUSE_DETECTED'
      );
    }

    // Check expiration
    if (tokenDoc.expiresAt < new Date()) {
      throw ApiError.unauthorized('Refresh token has expired', 'TOKEN_EXPIRED');
    }

    const user = await User.findById(tokenDoc.userId).select('+tokenVersion');
    if (!user) {
      throw ApiError.unauthorized('Associated user not found', 'USER_NOT_FOUND');
    }

    // Rotate: Revoke current token and generate replacement in same family
    const { rawToken: newRawToken, tokenHash: newTokenHash } = AuthService.generateRefreshTokenPair();

    tokenDoc.revokedAt = new Date();
    tokenDoc.replacedBy = newTokenHash;
    await tokenDoc.save();

    await RefreshToken.create({
      tokenHash: newTokenHash,
      userId: user._id,
      familyId: tokenDoc.familyId,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
      ip: meta.ip,
      userAgent: meta.userAgent
    });

    const accessToken = AuthService.generateAccessToken(user);

    await AuditLog.create({
      actorId: user._id,
      action: 'auth.refresh.success',
      target: user.email,
      ip: meta.ip || null
    });

    return {
      accessToken,
      refreshToken: newRawToken
    };
  }

  /**
   * Revokes the presented refresh token (single device logout).
   */
  static async logout(rawRefreshToken: string | undefined, actorId?: string, ip?: string) {
    if (rawRefreshToken) {
      const tokenHash = AuthService.hashToken(rawRefreshToken);
      await RefreshToken.findOneAndUpdate(
        { tokenHash, revokedAt: null },
        { revokedAt: new Date() }
      );
    }

    if (actorId) {
      await AuditLog.create({
        actorId,
        action: 'auth.logout',
        target: null,
        ip: ip || null
      });
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Bumps user's tokenVersion and revokes all refresh tokens (logout from all devices).
   */
  static async logoutAll(userId: string, ip?: string) {
    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });

    await RefreshToken.updateMany(
      { userId, revokedAt: null },
      { revokedAt: new Date() }
    );

    await AuditLog.create({
      actorId: userId,
      action: 'auth.logout_all',
      target: null,
      ip: ip || null,
      meta: { message: 'All active sessions invalidated via tokenVersion increment' }
    });

    return { message: 'All active sessions invalidated successfully' };
  }

  private static generateAccessToken(user: IUser): string {
    return jwt.sign(
      {
        sub: user._id.toString(),
        role: user.role,
        tokenVersion: user.tokenVersion
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_TTL }
    );
  }

  private static generateRefreshTokenPair() {
    const rawToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = AuthService.hashToken(rawToken);
    return { rawToken, tokenHash };
  }

  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export default AuthService;
