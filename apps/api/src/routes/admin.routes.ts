import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, ADMIN_ROLES } from '../middleware/rbac.js';
import {
  InviteUserSchema,
  UpdateUserRoleSchema,
  PaginationQuerySchema,
  CreateTenantSchema,
  UpdateTenantSchema,
  UuidSchema,
} from '@rim/types';
import * as svc from '../services/admin.service.js';

const router = Router();
router.use(requireAuth);

// ─── User management (admin role within tenant) ───────────────────────────────

/**
 * GET /admin/users
 * Paginated list of all users in the current tenant. Admin role required.
 */
router.get('/users', requireRole(ADMIN_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = PaginationQuerySchema.parse(req.query);
    const result = await svc.listTenantUsers(req.user!.tenantId, q);
    res.status(200).json(result);
  } catch (err) { next(err); }
});

/**
 * POST /admin/users/invite
 * Send invitation to a new user. Admin role required.
 */
router.post('/users/invite', requireRole(ADMIN_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = InviteUserSchema.parse(req.body);
    const result = await svc.inviteUser(req.user!.tenantId, req.user!.userId, dto, req.ip, req.headers['user-agent']);
    res.status(202).json(result);
  } catch (err) { next(err); }
});

/**
 * PATCH /admin/users/:id/role
 * Update a user's role. Admin role required.
 */
router.patch('/users/:id/role', requireRole(ADMIN_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const dto = UpdateUserRoleSchema.parse(req.body);
    const user = await svc.updateUserRole(req.user!.tenantId, req.user!.userId, req.params.id, dto, req.ip, req.headers['user-agent']);
    res.status(200).json(user);
  } catch (err) { next(err); }
});

/**
 * DELETE /admin/users/:id
 * Deactivate a user. Admin role required.
 */
router.delete('/users/:id', requireRole(ADMIN_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    await svc.deactivateUser(req.user!.tenantId, req.user!.userId, req.params.id, req.ip, req.headers['user-agent']);
    res.status(204).send();
  } catch (err) { next(err); }
});

// ─── Tenant management (super_admin only) ────────────────────────────────────

/**
 * GET /admin/tenants
 * List all tenants. super_admin only.
 */
router.get('/tenants', requireRole(ADMIN_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = PaginationQuerySchema.parse(req.query);
    const result = await svc.listTenants(q);
    res.status(200).json(result);
  } catch (err) { next(err); }
});

/**
 * POST /admin/tenants
 * Create a new tenant. super_admin only.
 */
router.post('/tenants', requireRole(ADMIN_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = CreateTenantSchema.parse(req.body);
    const tenant = await svc.createTenant(dto);
    res.status(201).json(tenant);
  } catch (err) { next(err); }
});

/**
 * PATCH /admin/tenants/:id
 * Update a tenant. super_admin only.
 */
router.patch('/tenants/:id', requireRole(ADMIN_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    UuidSchema.parse(req.params.id);
    const dto = UpdateTenantSchema.parse(req.body);
    const tenant = await svc.updateTenant(req.params.id, dto);
    res.status(200).json(tenant);
  } catch (err) { next(err); }
});

export { router as adminRouter };
