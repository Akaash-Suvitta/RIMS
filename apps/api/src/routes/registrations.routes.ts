import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, CONTRIBUTOR_ROLES, MANAGER_ROLES } from '../middleware/rbac.js';
import {
  CreateRegistrationSchema,
  UpdateRegistrationSchema,
  ListRegistrationsQuerySchema,
  UuidSchema,
} from '@rim/types';
import * as svc from '../services/registrations.service.js';

const router = Router();
router.use(requireAuth);

/** GET /registrations */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = ListRegistrationsQuerySchema.parse(req.query);
    const result = await svc.listRegistrations(req.user!.tenantId, q);
    res.status(200).json(result);
  } catch (err) { next(err); }
});

/** POST /registrations */
router.post('/', requireRole(CONTRIBUTOR_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = CreateRegistrationSchema.parse(req.body);
    const row = await svc.createRegistration(req.user!.tenantId, req.user!.userId, dto, req.ip, req.headers['user-agent']);
    res.status(201).json(row);
  } catch (err) { next(err); }
});

/** GET /registrations/:id */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const row = await svc.getRegistration(req.params.id, req.user!.tenantId);
    res.status(200).json(row);
  } catch (err) { next(err); }
});

/** PATCH /registrations/:id */
router.patch('/:id', requireRole(CONTRIBUTOR_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const dto = UpdateRegistrationSchema.parse(req.body);
    const row = await svc.updateRegistration(req.params.id, req.user!.tenantId, req.user!.userId, dto, req.ip, req.headers['user-agent']);
    res.status(200).json(row);
  } catch (err) { next(err); }
});

/** DELETE /registrations/:id/archive */
router.delete('/:id/archive', requireRole(MANAGER_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    await svc.archiveRegistration(req.params.id, req.user!.tenantId, req.user!.userId, req.ip, req.headers['user-agent']);
    res.status(204).send();
  } catch (err) { next(err); }
});

export { router as registrationsRouter };
