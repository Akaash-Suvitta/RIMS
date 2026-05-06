import { query } from '../client.js';
import type { PaginatedResult } from './tenants.js';

export interface RegistrationRow {
  id: string;
  tenant_id: string;
  product_id: string;
  country_id: string;
  ha_id: string;
  owner_user_id: string | null;
  registration_number: string | null;
  registration_type: string;
  status: string;
  approval_date: Date | null;
  expiry_date: Date | null;
  next_renewal_due: Date | null;
  days_until_expiry: number | null;
  renewal_initiated: boolean;
  lifecycle_stage: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
}

export interface CreateRegistrationData {
  tenantId: string;
  productId: string;
  countryId: string;
  haId: string;
  ownerUserId?: string;
  registrationNumber?: string;
  registrationType: string;
  status?: string;
  approvalDate?: Date;
  expiryDate?: Date;
  nextRenewalDue?: Date;
  lifecycleStage?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
}

export interface UpdateRegistrationData {
  ownerUserId?: string | null;
  registrationNumber?: string | null;
  registrationType?: string;
  status?: string;
  approvalDate?: Date | null;
  expiryDate?: Date | null;
  nextRenewalDue?: Date | null;
  renewalInitiated?: boolean;
  lifecycleStage?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  updatedBy?: string;
}

export interface FindAllRegistrationsOptions {
  page?: number;
  limit?: number;
  includeArchived?: boolean;
  filters?: {
    status?: string;
    countryId?: string;
    productId?: string;
    haId?: string;
  };
}

export const registrationsRepository = {
  async create(data: CreateRegistrationData): Promise<RegistrationRow> {
    const result = await query<RegistrationRow>(
      `INSERT INTO registrations
         (tenant_id, product_id, country_id, ha_id, owner_user_id,
          registration_number, registration_type, status,
          approval_date, expiry_date, next_renewal_due,
          lifecycle_stage, notes, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        data.tenantId,
        data.productId,
        data.countryId,
        data.haId,
        data.ownerUserId ?? null,
        data.registrationNumber ?? null,
        data.registrationType,
        data.status ?? 'pending',
        data.approvalDate ?? null,
        data.expiryDate ?? null,
        data.nextRenewalDue ?? null,
        data.lifecycleStage ?? null,
        data.notes ?? null,
        data.metadata ?? {},
        data.createdBy ?? null,
      ],
    );
    return result.rows[0];
  },

  async findById(id: string, tenantId: string): Promise<RegistrationRow | null> {
    const result = await query<RegistrationRow>(
      'SELECT * FROM registrations WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
    return result.rows[0] ?? null;
  },

  async findAll(
    tenantId: string,
    opts: FindAllRegistrationsOptions = {},
  ): Promise<PaginatedResult<RegistrationRow>> {
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
    if (opts.filters?.countryId) {
      conditions.push(`country_id = $${idx++}`);
      values.push(opts.filters.countryId);
    }
    if (opts.filters?.productId) {
      conditions.push(`product_id = $${idx++}`);
      values.push(opts.filters.productId);
    }
    if (opts.filters?.haId) {
      conditions.push(`ha_id = $${idx++}`);
      values.push(opts.filters.haId);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM registrations ${where}`,
      values,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const itemsResult = await query<RegistrationRow>(
      `SELECT * FROM registrations ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return { items: itemsResult.rows, total, page, limit };
  },

  async update(
    id: string,
    tenantId: string,
    data: UpdateRegistrationData,
  ): Promise<RegistrationRow> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.ownerUserId !== undefined)      { setClauses.push(`owner_user_id = $${idx++}`);       values.push(data.ownerUserId); }
    if (data.registrationNumber !== undefined){ setClauses.push(`registration_number = $${idx++}`); values.push(data.registrationNumber); }
    if (data.registrationType !== undefined) { setClauses.push(`registration_type = $${idx++}`);   values.push(data.registrationType); }
    if (data.status !== undefined)           { setClauses.push(`status = $${idx++}`);              values.push(data.status); }
    if (data.approvalDate !== undefined)     { setClauses.push(`approval_date = $${idx++}`);       values.push(data.approvalDate); }
    if (data.expiryDate !== undefined)       { setClauses.push(`expiry_date = $${idx++}`);         values.push(data.expiryDate); }
    if (data.nextRenewalDue !== undefined)   { setClauses.push(`next_renewal_due = $${idx++}`);    values.push(data.nextRenewalDue); }
    if (data.renewalInitiated !== undefined) { setClauses.push(`renewal_initiated = $${idx++}`);   values.push(data.renewalInitiated); }
    if (data.lifecycleStage !== undefined)   { setClauses.push(`lifecycle_stage = $${idx++}`);     values.push(data.lifecycleStage); }
    if (data.notes !== undefined)            { setClauses.push(`notes = $${idx++}`);               values.push(data.notes); }
    if (data.metadata !== undefined)         { setClauses.push(`metadata = $${idx++}`);            values.push(data.metadata); }
    if (data.updatedBy !== undefined)        { setClauses.push(`updated_by = $${idx++}`);          values.push(data.updatedBy); }

    if (setClauses.length === 0) {
      const current = await registrationsRepository.findById(id, tenantId);
      if (!current) throw new Error(`Registration not found: ${id}`);
      return current;
    }

    values.push(id, tenantId);
    const result = await query<RegistrationRow>(
      `UPDATE registrations SET ${setClauses.join(', ')}
       WHERE id = $${idx} AND tenant_id = $${idx + 1}
       RETURNING *`,
      values,
    );
    if (!result.rows[0]) throw new Error(`Registration not found: ${id}`);
    return result.rows[0];
  },

  async softDelete(id: string, tenantId: string, updatedBy?: string): Promise<void> {
    await query(
      `UPDATE registrations SET archived_at = NOW(), updated_by = $3
       WHERE id = $1 AND tenant_id = $2 AND archived_at IS NULL`,
      [id, tenantId, updatedBy ?? null],
    );
  },
};
