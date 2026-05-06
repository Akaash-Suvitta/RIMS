import { query } from '../client.js';
import type { PaginatedResult } from './tenants.js';

export interface RenewalRow {
  id: string;
  tenant_id: string;
  registration_id: string;
  renewal_number: string | null;
  status: string;
  initiated_date: Date | null;
  target_submission_date: Date | null;
  submitted_date: Date | null;
  approved_date: Date | null;
  renewal_expiry_date: Date | null;
  assigned_to: string | null;
  ai_package_generated: boolean;
  ai_package_generated_at: Date | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRenewalData {
  tenantId: string;
  registrationId: string;
  renewalNumber?: string;
  status?: string;
  initiatedDate?: Date;
  targetSubmissionDate?: Date;
  assignedTo?: string;
  notes?: string;
  createdBy?: string;
}

export interface UpdateRenewalData {
  renewalNumber?: string | null;
  status?: string;
  initiatedDate?: Date | null;
  targetSubmissionDate?: Date | null;
  submittedDate?: Date | null;
  approvedDate?: Date | null;
  renewalExpiryDate?: Date | null;
  assignedTo?: string | null;
  aiPackageGenerated?: boolean;
  aiPackageGeneratedAt?: Date | null;
  notes?: string | null;
  updatedBy?: string;
}

export interface FindAllRenewalsOptions {
  page?: number;
  limit?: number;
  filters?: {
    status?: string;
    registrationId?: string;
  };
}

export const renewalsRepository = {
  async create(data: CreateRenewalData): Promise<RenewalRow> {
    const result = await query<RenewalRow>(
      `INSERT INTO registration_renewals
         (tenant_id, registration_id, renewal_number, status,
          initiated_date, target_submission_date, assigned_to, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        data.tenantId,
        data.registrationId,
        data.renewalNumber ?? null,
        data.status ?? 'upcoming',
        data.initiatedDate ?? null,
        data.targetSubmissionDate ?? null,
        data.assignedTo ?? null,
        data.notes ?? null,
        data.createdBy ?? null,
      ],
    );
    return result.rows[0];
  },

  async findById(id: string, tenantId: string): Promise<RenewalRow | null> {
    const result = await query<RenewalRow>(
      'SELECT * FROM registration_renewals WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
    return result.rows[0] ?? null;
  },

  async findAll(
    tenantId: string,
    opts: FindAllRenewalsOptions = {},
  ): Promise<PaginatedResult<RenewalRow>> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let idx = 2;

    if (opts.filters?.status) {
      conditions.push(`status = $${idx++}`);
      values.push(opts.filters.status);
    }
    if (opts.filters?.registrationId) {
      conditions.push(`registration_id = $${idx++}`);
      values.push(opts.filters.registrationId);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM registration_renewals ${where}`,
      values,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const itemsResult = await query<RenewalRow>(
      `SELECT * FROM registration_renewals ${where}
       ORDER BY target_submission_date ASC NULLS LAST
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return { items: itemsResult.rows, total, page, limit };
  },

  async update(id: string, tenantId: string, data: UpdateRenewalData): Promise<RenewalRow> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.renewalNumber !== undefined)      { setClauses.push(`renewal_number = $${idx++}`);         values.push(data.renewalNumber); }
    if (data.status !== undefined)             { setClauses.push(`status = $${idx++}`);                 values.push(data.status); }
    if (data.initiatedDate !== undefined)      { setClauses.push(`initiated_date = $${idx++}`);         values.push(data.initiatedDate); }
    if (data.targetSubmissionDate !== undefined){ setClauses.push(`target_submission_date = $${idx++}`); values.push(data.targetSubmissionDate); }
    if (data.submittedDate !== undefined)      { setClauses.push(`submitted_date = $${idx++}`);         values.push(data.submittedDate); }
    if (data.approvedDate !== undefined)       { setClauses.push(`approved_date = $${idx++}`);          values.push(data.approvedDate); }
    if (data.renewalExpiryDate !== undefined)  { setClauses.push(`renewal_expiry_date = $${idx++}`);    values.push(data.renewalExpiryDate); }
    if (data.assignedTo !== undefined)         { setClauses.push(`assigned_to = $${idx++}`);            values.push(data.assignedTo); }
    if (data.aiPackageGenerated !== undefined) { setClauses.push(`ai_package_generated = $${idx++}`);   values.push(data.aiPackageGenerated); }
    if (data.aiPackageGeneratedAt !== undefined){ setClauses.push(`ai_package_generated_at = $${idx++}`); values.push(data.aiPackageGeneratedAt); }
    if (data.notes !== undefined)              { setClauses.push(`notes = $${idx++}`);                  values.push(data.notes); }
    if (data.updatedBy !== undefined)          { setClauses.push(`updated_by = $${idx++}`);             values.push(data.updatedBy); }

    if (setClauses.length === 0) {
      const current = await renewalsRepository.findById(id, tenantId);
      if (!current) throw new Error(`Renewal not found: ${id}`);
      return current;
    }

    values.push(id, tenantId);
    const result = await query<RenewalRow>(
      `UPDATE registration_renewals SET ${setClauses.join(', ')}
       WHERE id = $${idx} AND tenant_id = $${idx + 1}
       RETURNING *`,
      values,
    );
    if (!result.rows[0]) throw new Error(`Renewal not found: ${id}`);
    return result.rows[0];
  },

  async hardDelete(id: string, tenantId: string): Promise<void> {
    await query(
      'DELETE FROM registration_renewals WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
  },
};
