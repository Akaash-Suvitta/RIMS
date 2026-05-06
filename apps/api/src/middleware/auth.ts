import { Request, Response, NextFunction } from 'express';
import { env } from '../lib/config.js';

// Extend the Express Request type to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        tenantId: string;
        email: string;
        role: string;
      };
    }
  }
}

const LOCAL_TEST_TOKEN = 'test-token';

const LOCAL_TEST_USER = {
  userId: 'test-user',
  tenantId: 'test-tenant',
  email: 'test@regaxis.local',
  role: 'admin',
} as const;

/**
 * Auth middleware.
 *
 * local:  accepts `Authorization: Bearer test-token` and injects a hard-coded
 *         test identity — no network calls, no Cognito dependency.
 *
 * demo/production: TODO — verify JWT signature against Cognito JWKS endpoint
 *         using jwks-rsa + jsonwebtoken; attach decoded payload to req.user.
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Missing or malformed Authorization header',
    });
    return;
  }

  const token = authHeader.slice('Bearer '.length);

  if (env.isLocal) {
    if (token === LOCAL_TEST_TOKEN) {
      req.user = LOCAL_TEST_USER;
      next();
      return;
    }
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: `Local mode: use "Authorization: Bearer ${LOCAL_TEST_TOKEN}"`,
    });
    return;
  }

  // demo / production — real JWT verification (stub, to be implemented)
  // TODO: verify token with jwks-rsa + jsonwebtoken against Cognito JWKS
  res.status(501).json({
    code: 'NOT_IMPLEMENTED',
    message: 'JWT verification not yet implemented for demo/production',
  });
}
