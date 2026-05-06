import { Router, Request, Response } from 'express';
import { config } from './lib/config.js';
import { query } from './db/client.js';

// Route modules
import { authRouter }          from './routes/auth.routes.js';
import { registrationsRouter } from './routes/registrations.routes.js';
import { renewalsRouter }      from './routes/renewals.routes.js';
import { submissionsRouter }   from './routes/submissions.routes.js';
import { dossiersRouter }      from './routes/dossiers.routes.js';
import { documentsRouter }     from './routes/documents.routes.js';
import { productsRouter }      from './routes/products.routes.js';
import { referenceRouter }     from './routes/reference.routes.js';
import { aiInsightsRouter }    from './routes/ai-insights.routes.js';
import { labelingRouter }      from './routes/labeling.routes.js';
import { notificationsRouter } from './routes/notifications.routes.js';
import { auditLogRouter }      from './routes/audit-log.routes.js';
import { adminRouter }         from './routes/admin.routes.js';

const router = Router();

// ─── Health checks (public, no auth) ─────────────────────────────────────────

router.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    env: config.APP_ENV,
    version: '1.0.0',
  });
});

router.get('/health/db', async (_req: Request, res: Response): Promise<void> => {
  const start = Date.now();
  try {
    await query('SELECT 1');
    res.status(200).json({ status: 'ok', latencyMs: Date.now() - start });
  } catch {
    res.status(503).json({ status: 'error', latencyMs: Date.now() - start });
  }
});

// ─── API v1 routes ────────────────────────────────────────────────────────────

const V1 = '/api/v1';

router.use(`${V1}/auth`,          authRouter);
router.use(`${V1}/registrations`, registrationsRouter);
router.use(`${V1}/renewals`,      renewalsRouter);
router.use(`${V1}/submissions`,   submissionsRouter);
router.use(`${V1}/dossiers`,      dossiersRouter);
router.use(`${V1}/documents`,     documentsRouter);
router.use(`${V1}/products`,      productsRouter);
router.use(`${V1}`,               referenceRouter);   // /markets, /health-authorities
router.use(`${V1}/ai`,            aiInsightsRouter);
router.use(`${V1}/labels`,        labelingRouter);
router.use(`${V1}/notifications`, notificationsRouter);
router.use(`${V1}/audit-log`,     auditLogRouter);
router.use(`${V1}/admin`,         adminRouter);

export { router };
