import { Request, Response } from 'express';
import { config } from '../lib/config.js';

/**
 * GET /health
 * Public endpoint — used by the ALB health check and monitoring tools.
 */
export function healthHandler(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    env: config.APP_ENV,
    timestamp: new Date().toISOString(),
  });
}
