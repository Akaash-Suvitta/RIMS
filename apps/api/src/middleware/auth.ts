import { Request, Response, NextFunction } from 'express';
import { createServices } from '../lib/services.js';
import type { AuthUser } from '../lib/services.js';

export type { AuthUser };

// Extend the Express Request type to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Services singleton — created once and reused for auth verification
let _services: ReturnType<typeof createServices> | null = null;
function getServices() {
  if (!_services) _services = createServices();
  return _services;
}

/**
 * requireAuth middleware.
 *
 * Extracts the Bearer token from the Authorization header, verifies it
 * using the AuthAdapter (mock in local, Cognito JWT in demo/production),
 * and attaches the decoded user to req.user.
 *
 * Returns 401 if no token is present, 403 if the token is invalid/expired.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Missing or malformed Authorization header. Expected: Bearer <token>',
    });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const user = await getServices().auth.verifyToken(token);
    req.user = user;
    next();
  } catch (err: unknown) {
    const appErr = err as { statusCode?: number; code?: string; message?: string };
    const status = appErr.statusCode === 401 ? 401 : 403;
    res.status(status).json({
      code: appErr.code ?? (status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'),
      message: appErr.message ?? 'Invalid or expired token.',
    });
  }
}

/** Legacy alias kept for backward compatibility with existing routes.ts */
export const authMiddleware = requireAuth;
