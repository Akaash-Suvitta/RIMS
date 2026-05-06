import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, CONTRIBUTOR_ROLES } from '../middleware/rbac.js';
import {
  CreateProductSchema,
  UpdateProductSchema,
  ListProductsQuerySchema,
  UuidSchema,
} from '@rim/types';
import * as svc from '../services/products.service.js';

const router = Router();
router.use(requireAuth);

/** GET /products */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = ListProductsQuerySchema.parse(req.query);
    const result = await svc.listProducts(req.user!.tenantId, q);
    res.status(200).json(result);
  } catch (err) { next(err); }
});

/** POST /products */
router.post('/', requireRole(CONTRIBUTOR_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = CreateProductSchema.parse(req.body);
    const row = await svc.createProduct(req.user!.tenantId, req.user!.userId, dto, req.ip, req.headers['user-agent']);
    res.status(201).json(row);
  } catch (err) { next(err); }
});

/** GET /products/:id */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const row = await svc.getProduct(req.params.id, req.user!.tenantId);
    res.status(200).json(row);
  } catch (err) { next(err); }
});

/** PATCH /products/:id */
router.patch('/:id', requireRole(CONTRIBUTOR_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const dto = UpdateProductSchema.parse(req.body);
    const row = await svc.updateProduct(req.params.id, req.user!.tenantId, req.user!.userId, dto, req.ip, req.headers['user-agent']);
    res.status(200).json(row);
  } catch (err) { next(err); }
});

export { router as productsRouter };
