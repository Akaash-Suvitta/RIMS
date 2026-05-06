import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, CONTRIBUTOR_ROLES, MANAGER_ROLES } from '../middleware/rbac.js';
import {
  CreateLabelSchema,
  UpdateLabelSchema,
  ApproveLabelSchema,
  ListLabelsQuerySchema,
  UuidSchema,
} from '@rim/types';
import * as svc from '../services/labeling.service.js';

const router = Router();
router.use(requireAuth);

/** GET /labels */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = ListLabelsQuerySchema.parse(req.query);
    const result = await svc.listLabels(req.user!.tenantId, q);
    res.status(200).json(result);
  } catch (err) { next(err); }
});

/** POST /labels */
router.post('/', requireRole(CONTRIBUTOR_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = CreateLabelSchema.parse(req.body);
    const row = await svc.createLabel(req.user!.tenantId, req.user!.userId, dto, req.ip, req.headers['user-agent']);
    res.status(201).json(row);
  } catch (err) { next(err); }
});

/** GET /labels/:id */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const row = await svc.getLabel(req.params.id, req.user!.tenantId);
    res.status(200).json(row);
  } catch (err) { next(err); }
});

/** PATCH /labels/:id */
router.patch('/:id', requireRole(CONTRIBUTOR_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const dto = UpdateLabelSchema.parse(req.body);
    const row = await svc.updateLabel(req.params.id, req.user!.tenantId, req.user!.userId, dto, req.ip, req.headers['user-agent']);
    res.status(200).json(row);
  } catch (err) { next(err); }
});

/** POST /labels/:id/approve */
router.post('/:id/approve', requireRole(MANAGER_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const dto = ApproveLabelSchema.parse(req.body);
    const version = await svc.approveLabel(req.params.id, req.user!.tenantId, req.user!.userId, dto, req.ip, req.headers['user-agent']);
    res.status(200).json(version);
  } catch (err) { next(err); }
});

export { router as labelingRouter };
