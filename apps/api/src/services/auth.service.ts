import { usersRepository } from '../db/repositories/index.js';
import { Errors } from '../middleware/error.js';
import type { UserRow } from '../db/repositories/users.js';

/**
 * AuthService — thin orchestration layer for auth-related API endpoints.
 * Token verification itself lives in the AuthAdapter (lib/services.ts).
 */

/** Returns the full user profile for the authenticated user (GET /me). */
export async function getMyProfile(userId: string, tenantId: string): Promise<UserRow> {
  const user = await usersRepository.findById(userId);
  if (!user || user.tenant_id !== tenantId) {
    throw Errors.notFound('User profile not found.');
  }
  return user;
}

/** Updates the user's last_login_at timestamp (called after successful auth). */
export async function recordLogin(userId: string, tenantId: string): Promise<void> {
  await usersRepository.update(userId, tenantId, { lastLoginAt: new Date() });
}

/**
 * Token refresh is handled by the auth adapter (Cognito hosted UI / mock).
 * This service layer exists for future extensibility (e.g. refresh token blocklist).
 */
export async function refreshTokens(
  _refreshToken: string,
): Promise<{ accessToken: string; expiresIn: number }> {
  // In local mode this is a no-op stub — demo/production delegates to Cognito
  return { accessToken: 'stub-access-token', expiresIn: 3600 };
}
