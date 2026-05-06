import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, CONTRIBUTOR_ROLES, MANAGER_ROLES } from '../middleware/rbac.js';
import {
  DocumentUploadUrlSchema,
  ConfirmUploadSchema,
  UuidSchema,
} from '@rim/types';
import * as svc from '../services/documents.service.js';

const router = Router();
router.use(requireAuth);

/** POST /documents/upload-url — generate pre-signed S3 PUT URL */
router.post('/upload-url', requireRole(CONTRIBUTOR_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = DocumentUploadUrlSchema.parse(req.body);
    const result = await svc.generateUploadUrl(req.user!.tenantId, req.user!.userId, dto);
    res.status(200).json(result);
  } catch (err) { next(err); }
});

/** POST /documents/confirm-upload — mark upload complete after S3 PUT */
router.post('/confirm-upload', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = ConfirmUploadSchema.parse(req.body);
    const doc = await svc.confirmUpload(req.user!.tenantId, dto);
    res.status(200).json(doc);
  } catch (err) { next(err); }
});

/** GET /documents/:id/download-url — generate pre-signed GET URL (15 min) */
router.get('/:id/download-url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const result = await svc.getDownloadUrl(req.params.id, req.user!.tenantId);
    res.status(200).json(result);
  } catch (err) { next(err); }
});

/** DELETE /documents/:id — soft-archive */
router.delete('/:id', requireRole(MANAGER_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    await svc.archiveDocument(req.params.id, req.user!.tenantId, req.user!.userId, req.ip, req.headers['user-agent']);
    res.status(204).send();
  } catch (err) { next(err); }
});

export { router as documentsRouter };
