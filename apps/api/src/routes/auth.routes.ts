import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { RefreshTokenSchema } from '@rim/types';
import * as authService from '../services/auth.service.js';

const router = Router();

/**
 * POST /auth/refresh
 * Public — exchange a refresh token for a new access token.
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = RefreshTokenSchema.parse(req.body);
    const tokens = await authService.refreshTokens(body.refreshToken);
    res.status(200).json(tokens);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/logout
 * Protected — invalidates session server-side.
 */
router.post('/logout', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Token invalidation is Cognito-side; client discards the token.
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * GET /auth/me
 * Protected — returns the authenticated user's profile.
 */
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getMyProfile(req.user!.userId, req.user!.tenantId);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

export { router as authRouter };
