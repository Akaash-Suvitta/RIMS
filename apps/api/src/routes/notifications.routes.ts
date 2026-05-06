import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { ListNotificationsQuerySchema, UuidSchema } from '@rim/types';
import * as svc from '../services/notifications.service.js';

const router = Router();
router.use(requireAuth);

/** GET /notifications */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = ListNotificationsQuerySchema.parse(req.query);
    const result = await svc.listNotifications(req.user!.tenantId, req.user!.userId, q);
    res.status(200).json(result);
  } catch (err) { next(err); }
});

/** PATCH /notifications/:id/read — mark one notification read */
router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const result = await svc.markNotificationRead(req.params.id, req.user!.tenantId, req.user!.userId);
    res.status(200).json(result);
  } catch (err) { next(err); }
});

/** POST /notifications/read-all — mark all unread as read */
router.post('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.markAllNotificationsRead(req.user!.tenantId, req.user!.userId);
    res.status(200).json(result);
  } catch (err) { next(err); }
});

export { router as notificationsRouter };
