import { auditLogRepository } from '../db/repositories/index.js';

export interface AuditLogParams {
  tenantId: string;
  userId?: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'archive';
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * AuditService — thin wrapper around the audit log repository.
 * Called at the end of every mutating service method for tracked entities.
 * Swallows errors to ensure audit failures never break business operations.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await auditLogRepository.create({
      tenantId: params.tenantId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValues: params.oldValues,
      newValues: params.newValues,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (err) {
    console.error('[audit] Failed to write audit log entry:', err);
    // Do NOT rethrow — audit failures must not break business operations
  }
}
