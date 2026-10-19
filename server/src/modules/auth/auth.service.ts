import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import { User, RefreshToken, AuditLog } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashToken
} from '../../utils/token.js';
import { RegisterInput, LoginInput } from './auth.schema.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'customer' | 'admin';
  };
  accessToken: string;
  rawRefreshToken: string;
}

export class AuthService {
  /**
   * Registers a new user, hashes password with argon2id, issues tokens and creates audit log
   */
  async register(input: RegisterInput, ip?: string): Promise<AuthResult> {
    const existing = await User.findOne({ email: input.email }).lean();
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists', 'EMAIL_ALREADY_EXISTS');
    }

    const user = new User({
      name: input.name,
      email: input.email,
      password: input.password,
      role: 'customer'
    });

    await user.save();

    const accessToken = signAccessToken({
      sub: user._id.toString(),
      role: user.role,
      tokenVersion: user.tokenVersion
    });

    const { rawToken, tokenHash } = generateRefreshToken();
    const familyId = uuidv4();
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      tokenHash,
      userId: user._id,
      familyId,
      expiresAt
    });

    await AuditLog.create({
      actorId: user._id,
      action: 'auth.register',
      target: user._id.toString(),
      ip,
      meta: { email: user.email }
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      rawRefreshToken: rawToken
    };
  }

  /**
   * Logs in a user, checks lockout threshold, resets counters on success, rotates tokens
   */
  async login(input: LoginInput, ip?: string): Promise<AuthResult> {
    const user = await User.findOne({ email: input.email }).select(
      '+password +failedLogins +tokenVersion'
    );

    if (!user) {
      await AuditLog.create({
        action: 'auth.login.failed',
        ip,
        meta: { email: input.email, reason: 'user_not_found' }
      });
      throw ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    if (user.isLocked()) {
      await AuditLog.create({
        actorId: user._id,
        action: 'auth.login.locked',
        target: user._id.toString(),
        ip,
        meta: { email: user.email, lockUntil: user.lockUntil }
      });
      throw ApiError.unauthorized(
        'Account is temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.',
        'ACCOUNT_LOCKED'
      );
    }

    const isValid = await user.verifyPassword(input.password);

    if (!isValid) {
      user.failedLogins = (user.failedLogins || 0) + 1;

      if (user.failedLogins >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
        await user.save();

        await AuditLog.create({
          actorId: user._id,
          action: 'auth.login.locked',
          target: user._id.toString(),
          ip,
          meta: { email: user.email, lockUntil: user.lockUntil }
        });

        throw ApiError.unauthorized(
          'Account is temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.',
          'ACCOUNT_LOCKED'
        );
      }

      await user.save();

      await AuditLog.create({
        actorId: user._id,
        action: 'auth.login.failed',
        target: user._id.toString(),
        ip,
        meta: { email: user.email, failedLogins: user.failedLogins }
      });

      throw ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Reset failed login attempts on successful authentication
    user.failedLogins = 0;
    user.lockUntil = null;
    await user.save();

    const accessToken = signAccessToken({
      sub: user._id.toString(),
      role: user.role,
      tokenVersion: user.tokenVersion
    });

    const { rawToken, tokenHash } = generateRefreshToken();
    const familyId = uuidv4();
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      tokenHash,
      userId: user._id,
      familyId,
      expiresAt
    });

    await AuditLog.create({
      actorId: user._id,
      action: 'auth.login.success',
      target: user._id.toString(),
      ip
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      rawRefreshToken: rawToken
    };
  }

  /**
   * Refreshes JWT token with rotation and reuse detection (A07)
   */
  async refresh(
    rawRefreshToken: string,
    ip?: string
  ): Promise<{ accessToken: string; rawRefreshToken: string }> {
    if (!rawRefreshToken) {
      throw ApiError.unauthorized('Refresh token is required', 'REFRESH_TOKEN_REQUIRED');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const tokenRecord = await RefreshToken.findOne({ tokenHash });

    if (!tokenRecord) {
      throw ApiError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    // Reuse Detection: If a previously revoked token is presented, revoke all family tokens!
    if (tokenRecord.revokedAt) {
      await RefreshToken.updateMany(
        { familyId: tokenRecord.familyId },
        { revokedAt: new Date() }
      );

      await AuditLog.create({
        actorId: tokenRecord.userId,
        action: 'auth.refresh.reuse_detected',
        target: tokenRecord.userId.toString(),
        ip,
        meta: {
          familyId: tokenRecord.familyId,
          tokenHash,
          severity: 'HIGH_SECURITY_ALERT'
        }
      });

      throw ApiError.unauthorized(
        'Revoked refresh token reuse detected. All sessions in this family have been terminated.',
        'TOKEN_REUSE_DETECTED'
      );
    }

    if (tokenRecord.expiresAt.getTime() < Date.now()) {
      throw ApiError.unauthorized('Refresh token has expired', 'REFRESH_TOKEN_EXPIRED');
    }

    const user = await User.findById(tokenRecord.userId).select('+tokenVersion');
    if (!user) {
      throw ApiError.unauthorized('User not found', 'USER_NOT_FOUND');
    }

    if (user.isLocked()) {
      throw ApiError.unauthorized('Account is temporarily locked', 'ACCOUNT_LOCKED');
    }

    // Rotate: Issue new token pair, invalidate previous token
    const { rawToken: newRawToken, tokenHash: newTokenHash } = generateRefreshToken();
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    tokenRecord.revokedAt = new Date();
    tokenRecord.replacedBy = newTokenHash;
    await tokenRecord.save();

    await RefreshToken.create({
      tokenHash: newTokenHash,
      userId: user._id,
      familyId: tokenRecord.familyId,
      expiresAt
    });

    const accessToken = signAccessToken({
      sub: user._id.toString(),
      role: user.role,
      tokenVersion: user.tokenVersion
    });

    await AuditLog.create({
      actorId: user._id,
      action: 'auth.refresh.success',
      target: user._id.toString(),
      ip
    });

    return {
      accessToken,
      rawRefreshToken: newRawToken
    };
  }

  /**
   * Logs out user from current session, revoking the active refresh token
   */
  async logout(rawRefreshToken?: string, userId?: string, ip?: string): Promise<{ message: string }> {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await RefreshToken.updateOne(
        { tokenHash, revokedAt: null },
        { revokedAt: new Date() }
      );
    }

    await AuditLog.create({
      actorId: userId ? new mongoose.Types.ObjectId(userId) : null,
      action: 'auth.logout',
      target: userId || null,
      ip
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * Logs out user from all active sessions, increments tokenVersion and revokes all refresh tokens
   */
  async logoutAll(userId: string, ip?: string): Promise<{ message: string }> {
    const user = await User.findById(userId).select('+tokenVersion');
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    await RefreshToken.updateMany(
      { userId: user._id, revokedAt: null },
      { revokedAt: new Date() }
    );

    await AuditLog.create({
      actorId: user._id,
      action: 'auth.logout_all',
      target: user._id.toString(),
      ip
    });

    return { message: 'Logged out from all sessions successfully' };
  }

  /**
   * Authenticates or registers a user via Google OAuth (ID token)
   */
  async googleLogin(idToken: string, ip?: string): Promise<AuthResult> {
    let email: string;
    let name: string;
    let googleId: string;
    let avatar: string | undefined;

    // Handle mock token for test/dev mode
    if (idToken.startsWith('mock-google-token') && env.NODE_ENV !== 'production') {
      const parts = idToken.split(':');
      email = (parts[1] || 'google.user@example.com').toLowerCase();
      name = parts[2] || 'Google User';
      googleId = parts[3] || 'google_sub_12345';
      avatar = 'https://lh3.googleusercontent.com/a/default-user';
    } else {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
          throw ApiError.unauthorized('Invalid Google ID token payload', 'INVALID_GOOGLE_TOKEN');
        }

        email = payload.email.toLowerCase();
        name = payload.name || email.split('@')[0];
        googleId = payload.sub;
        avatar = payload.picture;
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw ApiError.unauthorized('Google authentication failed: invalid or expired token', 'INVALID_GOOGLE_TOKEN');
      }
    }

    // Find existing user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email }]
    });

    if (!user) {
      // Create new user authenticated via Google
      user = new User({
        name,
        email,
        googleId,
        avatar,
        role: 'customer'
      });
      await user.save();

      await AuditLog.create({
        actorId: user._id,
        action: 'auth.register.google',
        target: user._id.toString(),
        ip,
        meta: { email: user.email, googleId }
      });
    } else {
      // Link googleId or update avatar if missing
      let modified = false;
      if (!user.googleId) {
        user.googleId = googleId;
        modified = true;
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
        modified = true;
      }
      if (user.failedLogins > 0 || user.lockUntil) {
        user.failedLogins = 0;
        user.lockUntil = null;
        modified = true;
      }
      if (modified) {
        await user.save();
      }

      await AuditLog.create({
        actorId: user._id,
        action: 'auth.login.google',
        target: user._id.toString(),
        ip,
        meta: { email: user.email, googleId }
      });
    }

    const accessToken = signAccessToken({
      sub: user._id.toString(),
      role: user.role,
      tokenVersion: user.tokenVersion
    });

    const { rawToken, tokenHash } = generateRefreshToken();
    const familyId = uuidv4();
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      tokenHash,
      userId: user._id,
      familyId,
      expiresAt
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      rawRefreshToken: rawToken
    };
  }
}

export const authService = new AuthService();
export default authService;
