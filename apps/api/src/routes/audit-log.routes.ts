import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { ListAuditLogQuerySchema } from '@rim/types';
import { auditLogRepository } from '../db/repositories/index.js';

const router = Router();
router.use(requireAuth);

/**
 * GET /audit-log
 * Read-only endpoint for tenant-scoped audit log entries.
 * All roles have read access; entries are filtered by tenant.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = ListAuditLogQuerySchema.parse(req.query);

    const result = await auditLogRepository.findAll(req.user!.tenantId, {
      limit: q.limit,
      filters: {
        entityType: q.entity_type,
        entityId: q.entity_id,
        userId: q.user_id,
        action: q.action,
        fromDate: q.from_date ? new Date(q.from_date) : undefined,
        toDate: q.to_date ? new Date(q.to_date) : undefined,
      },
    });

    const nextCursor =
      result.items.length === (q.limit ?? 25)
        ? result.items[result.items.length - 1].id
        : null;

    res.status(200).json({
      data: result.items,
      total: result.total,
      nextCursor,
    });
  } catch (err) { next(err); }
});

export { router as auditLogRouter };
