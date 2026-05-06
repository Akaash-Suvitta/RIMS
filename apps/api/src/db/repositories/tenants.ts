import { query } from '../client.js';

export interface TenantRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTenantData {
  name: string;
  slug: string;
  plan?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateTenantData {
  name?: string;
  slug?: string;
  plan?: string;
  metadata?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface FindAllOptions {
  page?: number;
  limit?: number;
  filters?: {
    plan?: string;
  };
}

export const tenantsRepository = {
  async create(data: CreateTenantData): Promise<TenantRow> {
    const result = await query<TenantRow>(
      `INSERT INTO tenants (name, slug, plan, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.name, data.slug, data.plan ?? 'trial', data.metadata ?? {}],
    );
    return result.rows[0];
  },

  async findById(id: string): Promise<TenantRow | null> {
    const result = await query<TenantRow>(
      'SELECT * FROM tenants WHERE id = $1',
      [id],
    );
    return result.rows[0] ?? null;
  },

  async findBySlug(slug: string): Promise<TenantRow | null> {
    const result = await query<TenantRow>(
      'SELECT * FROM tenants WHERE slug = $1',
      [slug],
    );
    return result.rows[0] ?? null;
  },

  async findAll(opts: FindAllOptions = {}): Promise<PaginatedResult<TenantRow>> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (opts.filters?.plan) {
      conditions.push(`plan = $${idx++}`);
      values.push(opts.filters.plan);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM tenants ${where}`,
      values,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const itemsResult = await query<TenantRow>(
      `SELECT * FROM tenants ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return { items: itemsResult.rows, total, page, limit };
  },

  async update(id: string, data: UpdateTenantData): Promise<TenantRow> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) { setClauses.push(`name = $${idx++}`); values.push(data.name); }
    if (data.slug !== undefined) { setClauses.push(`slug = $${idx++}`); values.push(data.slug); }
    if (data.plan !== undefined) { setClauses.push(`plan = $${idx++}`); values.push(data.plan); }
    if (data.metadata !== undefined) { setClauses.push(`metadata = $${idx++}`); values.push(data.metadata); }

    if (setClauses.length === 0) {
      const current = await tenantsRepository.findById(id);
      if (!current) throw new Error(`Tenant not found: ${id}`);
      return current;
    }

    values.push(id);
    const result = await query<TenantRow>(
      `UPDATE tenants SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    if (!result.rows[0]) throw new Error(`Tenant not found: ${id}`);
    return result.rows[0];
  },

  async hardDelete(id: string): Promise<void> {
    await query('DELETE FROM tenants WHERE id = $1', [id]);
  },
};
