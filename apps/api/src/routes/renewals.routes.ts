import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, CONTRIBUTOR_ROLES } from '../middleware/rbac.js';
import {
  CreateRenewalSchema,
  UpdateRenewalSchema,
  ListRenewalsQuerySchema,
  CreateRenewalTaskSchema,
  UpdateRenewalTaskSchema,
  UuidSchema,
} from '@rim/types';
import * as svc from '../services/renewals.service.js';

const router = Router();
router.use(requireAuth);

/** GET /renewals */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = ListRenewalsQuerySchema.parse(req.query);
    const result = await svc.listRenewals(req.user!.tenantId, q);
    res.status(200).json(result);
  } catch (err) { next(err); }
});

/** POST /renewals */
router.post('/', requireRole(CONTRIBUTOR_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = CreateRenewalSchema.parse(req.body);
    const row = await svc.createRenewal(req.user!.tenantId, req.user!.userId, dto, req.ip, req.headers['user-agent']);
    res.status(201).json(row);
  } catch (err) { next(err); }
});

/** GET /renewals/:id */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const row = await svc.getRenewal(req.params.id, req.user!.tenantId);
    res.status(200).json(row);
  } catch (err) { next(err); }
});

/** PATCH /renewals/:id */
router.patch('/:id', requireRole(CONTRIBUTOR_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const dto = UpdateRenewalSchema.parse(req.body);
    const row = await svc.updateRenewal(req.params.id, req.user!.tenantId, req.user!.userId, dto, req.ip, req.headers['user-agent']);
    res.status(200).json(row);
  } catch (err) { next(err); }
});

/** GET /renewals/:id/tasks */
router.get('/:id/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const tasks = await svc.listRenewalTasks(req.params.id, req.user!.tenantId);
    res.status(200).json(tasks);
  } catch (err) { next(err); }
});

/** POST /renewals/:id/tasks */
router.post('/:id/tasks', requireRole(CONTRIBUTOR_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const dto = CreateRenewalTaskSchema.parse(req.body);
    const task = await svc.createRenewalTask(req.params.id, req.user!.tenantId, req.user!.userId, dto);
    res.status(201).json(task);
  } catch (err) { next(err); }
});

/** PATCH /renewals/:id/tasks/:taskId */
router.patch('/:id/tasks/:taskId', requireRole(CONTRIBUTOR_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    UuidSchema.parse(req.params.taskId);
    const dto = UpdateRenewalTaskSchema.parse(req.body);
    const task = await svc.updateRenewalTask(req.params.id, req.params.taskId, req.user!.tenantId, dto);
    res.status(200).json(task);
  } catch (err) { next(err); }
});

export { router as renewalsRouter };
