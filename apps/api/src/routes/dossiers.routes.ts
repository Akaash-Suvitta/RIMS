import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, CONTRIBUTOR_ROLES } from '../middleware/rbac.js';
import {
  CreateDossierSchema,
  UpdateDossierSchema,
  ListDossiersQuerySchema,
  CreateDossierModuleSchema,
  UuidSchema,
} from '@rim/types';
import * as svc from '../services/dossiers.service.js';

const router = Router();
router.use(requireAuth);

/** GET /dossiers */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = ListDossiersQuerySchema.parse(req.query);
    const result = await svc.listDossiers(req.user!.tenantId, q);
    res.status(200).json(result);
  } catch (err) { next(err); }
});

/** POST /dossiers */
router.post('/', requireRole(CONTRIBUTOR_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = CreateDossierSchema.parse(req.body);
    const row = await svc.createDossier(req.user!.tenantId, req.user!.userId, dto, req.ip, req.headers['user-agent']);
    res.status(201).json(row);
  } catch (err) { next(err); }
});

/** GET /dossiers/:id */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const row = await svc.getDossier(req.params.id, req.user!.tenantId);
    res.status(200).json(row);
  } catch (err) { next(err); }
});

/** PATCH /dossiers/:id */
router.patch('/:id', requireRole(CONTRIBUTOR_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const dto = UpdateDossierSchema.parse(req.body);
    const row = await svc.updateDossier(req.params.id, req.user!.tenantId, req.user!.userId, dto, req.ip, req.headers['user-agent']);
    res.status(200).json(row);
  } catch (err) { next(err); }
});

/** GET /dossiers/:id/sections */
router.get('/:id/sections', async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const sections = await svc.getDossierSections(req.params.id, req.user!.tenantId);
    res.status(200).json(sections);
  } catch (err) { next(err); }
});

/** POST /dossiers/:id/sections */
router.post('/:id/sections', requireRole(CONTRIBUTOR_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const dto = CreateDossierModuleSchema.parse(req.body);
    const section = await svc.createDossierSection(req.params.id, req.user!.tenantId, req.user!.userId, dto);
    res.status(201).json(section);
  } catch (err) { next(err); }
});

export { router as dossiersRouter };
