import { query } from '../client.js';
import type { PaginatedResult } from './tenants.js';

export interface DossierRow {
  id: string;
  tenant_id: string;
  product_id: string;
  target_ha_id: string | null;
  name: string;
  dossier_format: string;
  status: string;
  completeness_pct: number;
  ai_last_scanned_at: Date | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
}

export interface CreateDossierData {
  tenantId: string;
  productId: string;
  targetHaId?: string;
  name: string;
  dossierFormat?: string;
  status?: string;
  notes?: string;
  createdBy?: string;
}

export interface UpdateDossierData {
  name?: string;
  targetHaId?: string | null;
  dossierFormat?: string;
  status?: string;
  completenessPct?: number;
  aiLastScannedAt?: Date | null;
  notes?: string | null;
  updatedBy?: string;
}

export interface FindAllDossiersOptions {
  page?: number;
  limit?: number;
  includeArchived?: boolean;
  filters?: {
    status?: string;
    productId?: string;
  };
}

export const dossiersRepository = {
  async create(data: CreateDossierData): Promise<DossierRow> {
    const result = await query<DossierRow>(
      `INSERT INTO dossiers
         (tenant_id, product_id, target_ha_id, name,
          dossier_format, status, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        data.tenantId,
        data.productId,
        data.targetHaId ?? null,
        data.name,
        data.dossierFormat ?? 'ectd_v4',
        data.status ?? 'in_preparation',
        data.notes ?? null,
        data.createdBy ?? null,
      ],
    );
    return result.rows[0];
  },

  async findById(id: string, tenantId: string): Promise<DossierRow | null> {
    const result = await query<DossierRow>(
      'SELECT * FROM dossiers WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
    return result.rows[0] ?? null;
  },

  async findAll(
    tenantId: string,
    opts: FindAllDossiersOptions = {},
  ): Promise<PaginatedResult<DossierRow>> {
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

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM dossiers ${where}`,
      values,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const itemsResult = await query<DossierRow>(
      `SELECT * FROM dossiers ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return { items: itemsResult.rows, total, page, limit };
  },

  async update(id: string, tenantId: string, data: UpdateDossierData): Promise<DossierRow> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined)            { setClauses.push(`name = $${idx++}`);              values.push(data.name); }
    if (data.targetHaId !== undefined)      { setClauses.push(`target_ha_id = $${idx++}`);      values.push(data.targetHaId); }
    if (data.dossierFormat !== undefined)   { setClauses.push(`dossier_format = $${idx++}`);    values.push(data.dossierFormat); }
    if (data.status !== undefined)          { setClauses.push(`status = $${idx++}`);            values.push(data.status); }
    if (data.completenessPct !== undefined) { setClauses.push(`completeness_pct = $${idx++}`);  values.push(data.completenessPct); }
    if (data.aiLastScannedAt !== undefined) { setClauses.push(`ai_last_scanned_at = $${idx++}`); values.push(data.aiLastScannedAt); }
    if (data.notes !== undefined)           { setClauses.push(`notes = $${idx++}`);             values.push(data.notes); }
    if (data.updatedBy !== undefined)       { setClauses.push(`updated_by = $${idx++}`);        values.push(data.updatedBy); }

    if (setClauses.length === 0) {
      const current = await dossiersRepository.findById(id, tenantId);
      if (!current) throw new Error(`Dossier not found: ${id}`);
      return current;
    }

    values.push(id, tenantId);
    const result = await query<DossierRow>(
      `UPDATE dossiers SET ${setClauses.join(', ')}
       WHERE id = $${idx} AND tenant_id = $${idx + 1}
       RETURNING *`,
      values,
    );
    if (!result.rows[0]) throw new Error(`Dossier not found: ${id}`);
    return result.rows[0];
  },

  async softDelete(id: string, tenantId: string, updatedBy?: string): Promise<void> {
    await query(
      `UPDATE dossiers SET archived_at = NOW(), updated_by = $3
       WHERE id = $1 AND tenant_id = $2 AND archived_at IS NULL`,
      [id, tenantId, updatedBy ?? null],
    );
  },
};
