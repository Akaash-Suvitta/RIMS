import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, CONTRIBUTOR_ROLES } from '../middleware/rbac.js';
import {
  CreateSubmissionSchema,
  UpdateSubmissionSchema,
  ListSubmissionsQuerySchema,
  UuidSchema,
} from '@rim/types';
import * as svc from '../services/submissions.service.js';

const router = Router();
router.use(requireAuth);

/** GET /submissions */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = ListSubmissionsQuerySchema.parse(req.query);
    const result = await svc.listSubmissions(req.user!.tenantId, q);
    res.status(200).json(result);
  } catch (err) { next(err); }
});

/** POST /submissions */
router.post('/', requireRole(CONTRIBUTOR_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = CreateSubmissionSchema.parse(req.body);
    const row = await svc.createSubmission(req.user!.tenantId, req.user!.userId, dto, req.ip, req.headers['user-agent']);
    res.status(201).json(row);
  } catch (err) { next(err); }
});

/** GET /submissions/:id */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const row = await svc.getSubmission(req.params.id, req.user!.tenantId);
    res.status(200).json(row);
  } catch (err) { next(err); }
});

/** PATCH /submissions/:id */
router.patch('/:id', requireRole(CONTRIBUTOR_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const dto = UpdateSubmissionSchema.parse(req.body);
    const row = await svc.updateSubmission(req.params.id, req.user!.tenantId, req.user!.userId, dto, req.ip, req.headers['user-agent']);
    res.status(200).json(row);
  } catch (err) { next(err); }
});

export { router as submissionsRouter };
