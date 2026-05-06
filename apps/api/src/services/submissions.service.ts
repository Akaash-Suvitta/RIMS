import { submissionsRepository } from '../db/repositories/index.js';
import { logAudit } from './audit.service.js';
import { Errors } from '../middleware/error.js';
import type { SubmissionRow } from '../db/repositories/submissions.js';
import type { CreateSubmissionDto, UpdateSubmissionDto } from '@rim/types';

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft:        ['submitted', 'withdrawn'],
  submitted:    ['under_review', 'withdrawn'],
  under_review: ['approved', 'rejected', 'withdrawn'],
  approved:     [],
  rejected:     ['draft'],
  withdrawn:    [],
};

function toDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  return new Date(value);
}

export async function listSubmissions(
  tenantId: string,
  q: {
    cursor?: string;
    limit?: number;
    type?: string;
    status?: string;
    registration_id?: string;
    ha_id?: string;
  },
): Promise<{ data: SubmissionRow[]; total: number; nextCursor: string | null }> {
  const limit = q.limit ?? 25;
  const result = await submissionsRepository.findAll(tenantId, {
    limit,
    filters: {
      status: q.status,
      submissionType: q.type,
      haId: q.ha_id,
    },
  });
  const nextCursor =
    result.items.length === limit ? result.items[result.items.length - 1].id : null;
  return { data: result.items, total: result.total, nextCursor };
}

export async function createSubmission(
  tenantId: string,
  userId: string,
  dto: CreateSubmissionDto,
  ipAddress?: string,
  userAgent?: string,
): Promise<SubmissionRow> {
  const row = await submissionsRepository.create({
    tenantId,
    productId: dto.productId,
    haId: dto.haId,
    submissionType: dto.submissionType,
    dossierId: dto.dossierId,
    internalRef: dto.internalRef,
    targetFileDate: toDate(dto.targetFileDate),
    notes: dto.notes,
    createdBy: userId,
  });

  await logAudit({ tenantId, userId, action: 'create', entityType: 'submission', entityId: row.id, newValues: row as unknown as Record<string, unknown>, ipAddress, userAgent });
  return row;
}

export async function getSubmission(id: string, tenantId: string): Promise<SubmissionRow> {
  const row = await submissionsRepository.findById(id, tenantId);
  if (!row) throw Errors.notFound(`Submission ${id} not found.`);
  return row;
}

export async function updateSubmission(
  id: string,
  tenantId: string,
  userId: string,
  dto: UpdateSubmissionDto,
  ipAddress?: string,
  userAgent?: string,
): Promise<SubmissionRow> {
  const existing = await submissionsRepository.findById(id, tenantId);
  if (!existing) throw Errors.notFound(`Submission ${id} not found.`);

  // Validate status transition
  if (dto.status && dto.status !== existing.status) {
    const allowed = VALID_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw Errors.unprocessable(
        `Cannot transition submission from '${existing.status}' to '${dto.status}'.`,
      );
    }
  }

  const updated = await submissionsRepository.update(id, tenantId, {
    submissionType: dto.submissionType,
    status: dto.status,
    internalRef: dto.internalRef,
    targetFileDate: dto.targetFileDate !== undefined ? (dto.targetFileDate ? new Date(dto.targetFileDate) : null) : undefined,
    actualFileDate: dto.actualFileDate !== undefined ? (dto.actualFileDate ? new Date(dto.actualFileDate) : null) : undefined,
    pdufaDate: dto.pdufaDate !== undefined ? (dto.pdufaDate ? new Date(dto.pdufaDate) : null) : undefined,
    acceptanceDate: dto.acceptanceDate !== undefined ? (dto.acceptanceDate ? new Date(dto.acceptanceDate) : null) : undefined,
    completenessPct: dto.completenessPct,
    milestones: dto.milestones,
    notes: dto.notes,
    updatedBy: userId,
  });

  await logAudit({ tenantId, userId, action: 'update', entityType: 'submission', entityId: id, oldValues: existing as unknown as Record<string, unknown>, newValues: updated as unknown as Record<string, unknown>, ipAddress, userAgent });
  return updated;
}
