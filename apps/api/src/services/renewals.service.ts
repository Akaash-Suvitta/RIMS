import { renewalsRepository } from '../db/repositories/index.js';
import { query } from '../db/client.js';
import { logAudit } from './audit.service.js';
import { Errors } from '../middleware/error.js';
import type { RenewalRow } from '../db/repositories/renewals.js';
import type { CreateRenewalDto, UpdateRenewalDto, CreateRenewalTaskDto, UpdateRenewalTaskDto } from '@rim/types';

function toDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  return new Date(value);
}

export interface RenewalTaskRow {
  id: string;
  tenant_id: string;
  renewal_id?: string;
  assigned_user_id: string | null;
  title: string;
  description: string | null;
  status: string;
  due_date: Date | null;
  completed_at: Date | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export async function listRenewals(
  tenantId: string,
  q: {
    cursor?: string;
    limit?: number;
    status?: string;
    registration_id?: string;
    due_before?: string;
  },
): Promise<{ data: RenewalRow[]; total: number; nextCursor: string | null }> {
  const limit = q.limit ?? 25;
  const result = await renewalsRepository.findAll(tenantId, {
    limit,
    filters: {
      status: q.status,
      registrationId: q.registration_id,
    },
  });
  const nextCursor =
    result.items.length === limit ? result.items[result.items.length - 1].id : null;
  return { data: result.items, total: result.total, nextCursor };
}

export async function createRenewal(
  tenantId: string,
  userId: string,
  dto: CreateRenewalDto,
  ipAddress?: string,
  userAgent?: string,
): Promise<RenewalRow> {
  const row = await renewalsRepository.create({
    tenantId,
    registrationId: dto.registrationId,
    targetSubmissionDate: toDate(dto.targetSubmissionDate),
    assignedTo: dto.assignedTo,
    renewalNumber: dto.renewalNumber,
    notes: dto.notes,
    createdBy: userId,
  });

  await logAudit({ tenantId, userId, action: 'create', entityType: 'registration_renewal', entityId: row.id, newValues: row as unknown as Record<string, unknown>, ipAddress, userAgent });
  return row;
}

export async function getRenewal(id: string, tenantId: string): Promise<RenewalRow> {
  const row = await renewalsRepository.findById(id, tenantId);
  if (!row) throw Errors.notFound(`Renewal ${id} not found.`);
  return row;
}

export async function updateRenewal(
  id: string,
  tenantId: string,
  userId: string,
  dto: UpdateRenewalDto,
  ipAddress?: string,
  userAgent?: string,
): Promise<RenewalRow> {
  const existing = await renewalsRepository.findById(id, tenantId);
  if (!existing) throw Errors.notFound(`Renewal ${id} not found.`);

  const updated = await renewalsRepository.update(id, tenantId, {
    renewalNumber: dto.renewalNumber,
    status: dto.status,
    initiatedDate: dto.initiatedDate !== undefined ? (dto.initiatedDate ? new Date(dto.initiatedDate) : null) : undefined,
    targetSubmissionDate: dto.targetSubmissionDate !== undefined ? (dto.targetSubmissionDate ? new Date(dto.targetSubmissionDate) : null) : undefined,
    submittedDate: dto.submittedDate !== undefined ? (dto.submittedDate ? new Date(dto.submittedDate) : null) : undefined,
    approvedDate: dto.approvedDate !== undefined ? (dto.approvedDate ? new Date(dto.approvedDate) : null) : undefined,
    renewalExpiryDate: dto.renewalExpiryDate !== undefined ? (dto.renewalExpiryDate ? new Date(dto.renewalExpiryDate) : null) : undefined,
    assignedTo: dto.assignedTo,
    notes: dto.notes,
    updatedBy: userId,
  });

  await logAudit({ tenantId, userId, action: 'update', entityType: 'registration_renewal', entityId: id, oldValues: existing as unknown as Record<string, unknown>, newValues: updated as unknown as Record<string, unknown>, ipAddress, userAgent });
  return updated;
}

// ─── Renewal Tasks ────────────────────────────────────────────────────────────
// The DB schema uses `registration_conditions` for renewal-related tasks
// (registration_conditions has status, due_date, assigned fields).
// Tasks in the API contract map to registration_conditions for renewals.
// Note: if a dedicated `renewal_tasks` table is added in a later migration,
// update these queries accordingly.

export async function listRenewalTasks(renewalId: string, tenantId: string): Promise<RenewalTaskRow[]> {
  // Return tasks from registration_conditions scoped to the registration
  // associated with this renewal (via JOIN).
  const result = await query<RenewalTaskRow>(
    `SELECT rc.id,
            rc.tenant_id,
            rr.id AS renewal_id,
            NULL::uuid AS assigned_user_id,
            rc.condition_text AS title,
            rc.notes AS description,
            rc.status,
            rc.due_date,
            rc.fulfilled_date AS completed_at,
            0 AS sort_order,
            rc.created_at,
            rc.updated_at
     FROM registration_conditions rc
     JOIN registrations r ON rc.registration_id = r.id
     JOIN registration_renewals rr ON rr.registration_id = r.id
     WHERE rr.id = $1 AND rc.tenant_id = $2
     ORDER BY rc.created_at ASC`,
    [renewalId, tenantId],
  );
  return result.rows;
}

export async function createRenewalTask(
  renewalId: string,
  tenantId: string,
  userId: string,
  dto: CreateRenewalTaskDto,
): Promise<RenewalTaskRow> {
  // Get registration_id from the renewal
  const renewalResult = await query<{ registration_id: string }>(
    'SELECT registration_id FROM registration_renewals WHERE id = $1 AND tenant_id = $2',
    [renewalId, tenantId],
  );
  if (!renewalResult.rows[0]) throw Errors.notFound(`Renewal ${renewalId} not found.`);

  const registrationId = renewalResult.rows[0].registration_id;

  const result = await query<{ id: string; tenant_id: string; condition_text: string; notes: string | null; status: string; due_date: Date | null; fulfilled_date: Date | null; created_at: Date; updated_at: Date }>(
    `INSERT INTO registration_conditions
       (tenant_id, registration_id, condition_text, notes, due_date, status, created_by)
     VALUES ($1, $2, $3, $4, $5, 'todo', $6)
     RETURNING *`,
    [tenantId, registrationId, dto.title, dto.description ?? null, dto.dueDate ? new Date(dto.dueDate) : null, userId],
  );

  const row = result.rows[0];
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    renewal_id: renewalId,
    assigned_user_id: dto.assignedUserId ?? null,
    title: row.condition_text,
    description: row.notes,
    status: row.status,
    due_date: row.due_date,
    completed_at: row.fulfilled_date,
    sort_order: dto.sortOrder ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function updateRenewalTask(
  _renewalId: string,
  taskId: string,
  tenantId: string,
  dto: UpdateRenewalTaskDto,
): Promise<RenewalTaskRow> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (dto.title !== undefined)    { setClauses.push(`condition_text = $${idx++}`); values.push(dto.title); }
  if (dto.description !== undefined) { setClauses.push(`notes = $${idx++}`);       values.push(dto.description); }
  if (dto.status !== undefined)   { setClauses.push(`status = $${idx++}`);          values.push(dto.status); }
  if (dto.dueDate !== undefined)  { setClauses.push(`due_date = $${idx++}`);         values.push(dto.dueDate ? new Date(dto.dueDate) : null); }

  if (setClauses.length === 0) {
    const existing = await query<{ id: string; tenant_id: string; condition_text: string; notes: string | null; status: string; due_date: Date | null; fulfilled_date: Date | null; created_at: Date; updated_at: Date }>(
      'SELECT * FROM registration_conditions WHERE id = $1 AND tenant_id = $2',
      [taskId, tenantId],
    );
    if (!existing.rows[0]) throw Errors.notFound(`Task ${taskId} not found.`);
    const r = existing.rows[0];
    return { id: r.id, tenant_id: r.tenant_id, renewal_id: _renewalId, assigned_user_id: null, title: r.condition_text, description: r.notes, status: r.status, due_date: r.due_date, completed_at: r.fulfilled_date, sort_order: 0, created_at: r.created_at, updated_at: r.updated_at };
  }

  values.push(taskId, tenantId);
  const result = await query<{ id: string; tenant_id: string; condition_text: string; notes: string | null; status: string; due_date: Date | null; fulfilled_date: Date | null; created_at: Date; updated_at: Date }>(
    `UPDATE registration_conditions SET ${setClauses.join(', ')}
     WHERE id = $${idx} AND tenant_id = $${idx + 1}
     RETURNING *`,
    values,
  );
  if (!result.rows[0]) throw Errors.notFound(`Task ${taskId} not found.`);
  const r = result.rows[0];
  return { id: r.id, tenant_id: r.tenant_id, renewal_id: _renewalId, assigned_user_id: null, title: r.condition_text, description: r.notes, status: r.status, due_date: r.due_date, completed_at: r.fulfilled_date, sort_order: 0, created_at: r.created_at, updated_at: r.updated_at };
}
