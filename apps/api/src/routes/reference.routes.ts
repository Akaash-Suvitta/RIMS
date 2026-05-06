import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { UuidSchema } from '@rim/types';
import { z } from 'zod';
import * as svc from '../services/reference.service.js';

const router = Router();
router.use(requireAuth);

/**
 * GET /markets
 * Returns all markets (countries) with embedded health authorities.
 * Not paginated — full reference list (~200 countries).
 */
router.get('/markets', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const markets = await svc.listMarkets();
    res.status(200).json(markets);
  } catch (err) { next(err); }
});

/**
 * GET /health-authorities
 * Returns health authorities, optionally filtered by country_id.
 */
router.get('/health-authorities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country_id } = z.object({ country_id: UuidSchema.optional() }).parse(req.query);
    const has = await svc.listHealthAuthorities(country_id);
    res.status(200).json(has);
  } catch (err) { next(err); }
});

export { router as referenceRouter };
