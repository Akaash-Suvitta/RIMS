import { Request, Response, NextFunction } from 'express';

/**
 * GET /api/v1/registrations
 * List all registrations for the authenticated tenant.
 * TODO: implement — query registrations repository with tenantId filter, support pagination
 */
export function listRegistrations(
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // TODO: extract pagination params (page, pageSize) from query
  // TODO: call registrationsRepository.findByTenantId(req.user.tenantId, { page, pageSize })
  // TODO: return PaginatedResponse<Registration>
  res.status(200).json({
    data: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
}

/**
 * POST /api/v1/registrations
 * Create a new registration.
 * TODO: implement — Zod-validate body, call registrationsService.create
 */
export function createRegistration(
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // TODO: validate req.body with CreateRegistrationDto Zod schema
  // TODO: call registrationsService.create(req.user.tenantId, req.user.userId, dto)
  // TODO: return 201 with created Registration
  res.status(501).json({ code: 'NOT_IMPLEMENTED', message: 'createRegistration not yet implemented' });
}

/**
 * GET /api/v1/registrations/:id
 * Get a single registration by ID (tenant-scoped).
 * TODO: implement — fetch by id + tenantId, return 404 if not found
 */
export function getRegistrationById(
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // TODO: validate req.params.id
  // TODO: call registrationsRepository.findById(id, req.user.tenantId)
  // TODO: return 404 if null
  res.status(501).json({ code: 'NOT_IMPLEMENTED', message: 'getRegistrationById not yet implemented' });
}

/**
 * PATCH /api/v1/registrations/:id
 * Update a registration.
 * TODO: implement — Zod-validate body, call registrationsService.update
 */
export function updateRegistration(
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // TODO: validate req.params.id and req.body with UpdateRegistrationDto Zod schema
  // TODO: call registrationsService.update(id, req.user.tenantId, dto)
  res.status(501).json({ code: 'NOT_IMPLEMENTED', message: 'updateRegistration not yet implemented' });
}

/**
 * DELETE /api/v1/registrations/:id
 * Archive (soft-delete) a registration.
 * TODO: implement — set status to 'archived', write audit log entry
 */
export function archiveRegistration(
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // TODO: call registrationsService.archive(id, req.user.tenantId, req.user.userId)
  // TODO: write AuditLog entry via auditService
  res.status(501).json({ code: 'NOT_IMPLEMENTED', message: 'archiveRegistration not yet implemented' });
}
