import { Request, Response, NextFunction, RequestHandler } from 'express';

export type UserRole =
  | 'super_admin'
  | 'regulatory_lead'
  | 'regulatory_affairs_manager'
  | 'regulatory_affairs_specialist'
  | 'dossier_manager'
  | 'submission_coordinator'
  | 'labeling_specialist'
  | 'read_only'
  | 'external_reviewer';

/** Roles that can create/update (contributor and above). */
export const CONTRIBUTOR_ROLES: UserRole[] = [
  'regulatory_affairs_specialist',
  'dossier_manager',
  'submission_coordinator',
  'labeling_specialist',
  'regulatory_affairs_manager',
  'regulatory_lead',
  'super_admin',
];

/** Roles that can perform management operations. */
export const MANAGER_ROLES: UserRole[] = [
  'regulatory_affairs_manager',
  'regulatory_lead',
  'super_admin',
];

/** Admin-only. */
export const ADMIN_ROLES: UserRole[] = ['super_admin'];

/**
 * Returns an Express middleware that checks the authenticated user's role
 * against the allowed list. Responds with 403 if the role is insufficient.
 *
 * Usage:
 *   router.delete('/items/:id', requireAuth, requireRole(MANAGER_ROLES), handler);
 */
export function requireRole(allowed: UserRole[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role as UserRole | undefined;
    if (!userRole || !allowed.includes(userRole)) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: `Role '${userRole ?? 'unknown'}' cannot perform this action.`,
      });
      return;
    }
    next();
  };
}
