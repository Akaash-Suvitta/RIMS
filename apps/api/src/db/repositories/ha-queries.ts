import { query } from '../client.js';
import type { PaginatedResult } from './tenants.js';

export interface HaQueryRow {
  id: string;
  tenant_id: string;
  submission_id: string;
  ha_id: string;
  query_reference: string | null;
  query_text: string;
  query_type: string;
  status: string;
  received_date: Date;
  due_date: Date | null;
  response_date: Date | null;
  ai_draft_ready: boolean;
  ai_draft_generated_at: Date | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateHaQueryData {
  tenantId: string;
  submissionId: string;
  haId: string;
  queryReference?: string;
  queryText: string;
  queryType?: string;
  status?: string;
  receivedDate: Date;
  dueDate?: Date;
  notes?: string;
  createdBy?: string;
}

export interface UpdateHaQueryData {
  queryReference?: string | null;
  queryText?: string;
  queryType?: string;
  status?: string;
  dueDate?: Date | null;
  responseDate?: Date | null;
  aiDraftReady?: boolean;
  aiDraftGeneratedAt?: Date | null;
  notes?: string | null;
  updatedBy?: string;
}

export interface FindAllHaQueriesOptions {
  page?: number;
  limit?: number;
  filters?: {
    status?: string;
    submissionId?: string;
    queryType?: string;
  };
}

export const haQueriesRepository = {
  async create(data: CreateHaQueryData): Promise<HaQueryRow> {
    const result = await query<HaQueryRow>(
      `INSERT INTO ha_queries
         (tenant_id, submission_id, ha_id, query_reference, query_text,
          query_type, status, received_date, due_date, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        data.tenantId,
        data.submissionId,
        data.haId,
        data.queryReference ?? null,
        data.queryText,
        data.queryType ?? 'general',
        data.status ?? 'open',
        data.receivedDate,
        data.dueDate ?? null,
        data.notes ?? null,
        data.createdBy ?? null,
      ],
    );
    return result.rows[0];
  },

  async findById(id: string, tenantId: string): Promise<HaQueryRow | null> {
    const result = await query<HaQueryRow>(
      'SELECT * FROM ha_queries WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
    return result.rows[0] ?? null;
  },

  async findAll(
    tenantId: string,
    opts: FindAllHaQueriesOptions = {},
  ): Promise<PaginatedResult<HaQueryRow>> {
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
    if (opts.filters?.submissionId) {
      conditions.push(`submission_id = $${idx++}`);
      values.push(opts.filters.submissionId);
    }
    if (opts.filters?.queryType) {
      conditions.push(`query_type = $${idx++}`);
      values.push(opts.filters.queryType);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ha_queries ${where}`,
      values,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const itemsResult = await query<HaQueryRow>(
      `SELECT * FROM ha_queries ${where}
       ORDER BY due_date ASC NULLS LAST
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return { items: itemsResult.rows, total, page, limit };
  },

  async update(id: string, tenantId: string, data: UpdateHaQueryData): Promise<HaQueryRow> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.queryReference !== undefined)    { setClauses.push(`query_reference = $${idx++}`);     values.push(data.queryReference); }
    if (data.queryText !== undefined)         { setClauses.push(`query_text = $${idx++}`);           values.push(data.queryText); }
    if (data.queryType !== undefined)         { setClauses.push(`query_type = $${idx++}`);           values.push(data.queryType); }
    if (data.status !== undefined)            { setClauses.push(`status = $${idx++}`);               values.push(data.status); }
    if (data.dueDate !== undefined)           { setClauses.push(`due_date = $${idx++}`);             values.push(data.dueDate); }
    if (data.responseDate !== undefined)      { setClauses.push(`response_date = $${idx++}`);        values.push(data.responseDate); }
    if (data.aiDraftReady !== undefined)      { setClauses.push(`ai_draft_ready = $${idx++}`);       values.push(data.aiDraftReady); }
    if (data.aiDraftGeneratedAt !== undefined){ setClauses.push(`ai_draft_generated_at = $${idx++}`); values.push(data.aiDraftGeneratedAt); }
    if (data.notes !== undefined)             { setClauses.push(`notes = $${idx++}`);                values.push(data.notes); }
    if (data.updatedBy !== undefined)         { setClauses.push(`updated_by = $${idx++}`);           values.push(data.updatedBy); }

    if (setClauses.length === 0) {
      const current = await haQueriesRepository.findById(id, tenantId);
      if (!current) throw new Error(`HA Query not found: ${id}`);
      return current;
    }

    values.push(id, tenantId);
    const result = await query<HaQueryRow>(
      `UPDATE ha_queries SET ${setClauses.join(', ')}
       WHERE id = $${idx} AND tenant_id = $${idx + 1}
       RETURNING *`,
      values,
    );
    if (!result.rows[0]) throw new Error(`HA Query not found: ${id}`);
    return result.rows[0];
  },

  async hardDelete(id: string, tenantId: string): Promise<void> {
    await query(
      'DELETE FROM ha_queries WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
  },
};
