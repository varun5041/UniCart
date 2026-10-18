import argon2 from 'argon2';
import bcrypt from 'bcryptjs';
import { logger } from '../config/logger.js';

/**
 * Hashes a plaintext password using Argon2id with automatic fallback to bcrypt (cost 12).
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 1
    });
  } catch (err) {
    logger.warn({ msg: '[Password] Argon2 unavailable or failed, utilizing bcrypt fallback (cost 12)', err });
    return await bcrypt.hash(password, 12);
  }
}

/**
 * Compares plaintext password against either Argon2 or bcrypt hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    if (hash.startsWith('$argon2')) {
      return await argon2.verify(hash, password);
    }
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      return await bcrypt.compare(password, hash);
    }
    return false;
  } catch (err) {
    logger.error({ msg: '[Password] Error during password comparison', err });
    return false;
  }
}
