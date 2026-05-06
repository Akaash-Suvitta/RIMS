import { query } from '../client.js';
import type { PaginatedResult } from './tenants.js';

export interface SubmissionRow {
  id: string;
  tenant_id: string;
  product_id: string;
  ha_id: string;
  dossier_id: string | null;
  lead_user_id: string | null;
  submission_number: string | null;
  internal_ref: string | null;
  submission_type: string;
  status: string;
  target_file_date: Date | null;
  actual_file_date: Date | null;
  pdufa_date: Date | null;
  acceptance_date: Date | null;
  completeness_pct: number;
  milestones: unknown[];
  notes: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
}

export interface CreateSubmissionData {
  tenantId: string;
  productId: string;
  haId: string;
  dossierId?: string;
  leadUserId?: string;
  submissionNumber?: string;
  internalRef?: string;
  submissionType: string;
  status?: string;
  targetFileDate?: Date;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
}

export interface UpdateSubmissionData {
  leadUserId?: string | null;
  submissionNumber?: string | null;
  internalRef?: string | null;
  submissionType?: string;
  status?: string;
  targetFileDate?: Date | null;
  actualFileDate?: Date | null;
  pdufaDate?: Date | null;
  acceptanceDate?: Date | null;
  completenessPct?: number;
  milestones?: unknown[];
  notes?: string | null;
  metadata?: Record<string, unknown>;
  updatedBy?: string;
}

export interface FindAllSubmissionsOptions {
  page?: number;
  limit?: number;
  includeArchived?: boolean;
  filters?: {
    status?: string;
    productId?: string;
    haId?: string;
    submissionType?: string;
  };
}

export const submissionsRepository = {
  async create(data: CreateSubmissionData): Promise<SubmissionRow> {
    const result = await query<SubmissionRow>(
      `INSERT INTO submissions
         (tenant_id, product_id, ha_id, dossier_id, lead_user_id,
          submission_number, internal_ref, submission_type, status,
          target_file_date, notes, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        data.tenantId,
        data.productId,
        data.haId,
        data.dossierId ?? null,
        data.leadUserId ?? null,
        data.submissionNumber ?? null,
        data.internalRef ?? null,
        data.submissionType,
        data.status ?? 'draft',
        data.targetFileDate ?? null,
        data.notes ?? null,
        data.metadata ?? {},
        data.createdBy ?? null,
      ],
    );
    return result.rows[0];
  },

  async findById(id: string, tenantId: string): Promise<SubmissionRow | null> {
    const result = await query<SubmissionRow>(
      'SELECT * FROM submissions WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
    return result.rows[0] ?? null;
  },

  async findAll(
    tenantId: string,
    opts: FindAllSubmissionsOptions = {},
  ): Promise<PaginatedResult<SubmissionRow>> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let idx = 2;

    if (!opts.includeArchived) {
      conditions.push('archived_at IS NULL');
    }
    if (opts.filters?.status) {
      conditions.push(`status = $${idx++}`);
      values.push(opts.filters.status);
    }
    if (opts.filters?.productId) {
      conditions.push(`product_id = $${idx++}`);
      values.push(opts.filters.productId);
    }
    if (opts.filters?.haId) {
      conditions.push(`ha_id = $${idx++}`);
      values.push(opts.filters.haId);
    }
    if (opts.filters?.submissionType) {
      conditions.push(`submission_type = $${idx++}`);
      values.push(opts.filters.submissionType);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM submissions ${where}`,
      values,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const itemsResult = await query<SubmissionRow>(
      `SELECT * FROM submissions ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return { items: itemsResult.rows, total, page, limit };
  },

  async update(
    id: string,
    tenantId: string,
    data: UpdateSubmissionData,
  ): Promise<SubmissionRow> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.leadUserId !== undefined)     { setClauses.push(`lead_user_id = $${idx++}`);     values.push(data.leadUserId); }
    if (data.submissionNumber !== undefined){ setClauses.push(`submission_number = $${idx++}`); values.push(data.submissionNumber); }
    if (data.internalRef !== undefined)    { setClauses.push(`internal_ref = $${idx++}`);     values.push(data.internalRef); }
    if (data.submissionType !== undefined) { setClauses.push(`submission_type = $${idx++}`);  values.push(data.submissionType); }
    if (data.status !== undefined)         { setClauses.push(`status = $${idx++}`);           values.push(data.status); }
    if (data.targetFileDate !== undefined) { setClauses.push(`target_file_date = $${idx++}`); values.push(data.targetFileDate); }
    if (data.actualFileDate !== undefined) { setClauses.push(`actual_file_date = $${idx++}`); values.push(data.actualFileDate); }
    if (data.pdufaDate !== undefined)      { setClauses.push(`pdufa_date = $${idx++}`);       values.push(data.pdufaDate); }
    if (data.acceptanceDate !== undefined) { setClauses.push(`acceptance_date = $${idx++}`);  values.push(data.acceptanceDate); }
    if (data.completenessPct !== undefined){ setClauses.push(`completeness_pct = $${idx++}`); values.push(data.completenessPct); }
    if (data.milestones !== undefined)     { setClauses.push(`milestones = $${idx++}`);       values.push(JSON.stringify(data.milestones)); }
    if (data.notes !== undefined)          { setClauses.push(`notes = $${idx++}`);            values.push(data.notes); }
    if (data.metadata !== undefined)       { setClauses.push(`metadata = $${idx++}`);         values.push(data.metadata); }
    if (data.updatedBy !== undefined)      { setClauses.push(`updated_by = $${idx++}`);       values.push(data.updatedBy); }

    if (setClauses.length === 0) {
      const current = await submissionsRepository.findById(id, tenantId);
      if (!current) throw new Error(`Submission not found: ${id}`);
      return current;
    }

    values.push(id, tenantId);
    const result = await query<SubmissionRow>(
      `UPDATE submissions SET ${setClauses.join(', ')}
       WHERE id = $${idx} AND tenant_id = $${idx + 1}
       RETURNING *`,
      values,
    );
    if (!result.rows[0]) throw new Error(`Submission not found: ${id}`);
    return result.rows[0];
  },

  async softDelete(id: string, tenantId: string, updatedBy?: string): Promise<void> {
    await query(
      `UPDATE submissions SET archived_at = NOW(), updated_by = $3
       WHERE id = $1 AND tenant_id = $2 AND archived_at IS NULL`,
      [id, tenantId, updatedBy ?? null],
    );
  },
};
