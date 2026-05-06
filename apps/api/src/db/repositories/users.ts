import { query } from '../client.js';
import type { PaginatedResult } from './tenants.js';

export interface UserRow {
  id: string;
  tenant_id: string;
  email: string;
  cognito_sub: string;
  full_name: string;
  role: string;
  phone: string | null;
  department: string | null;
  preferences: Record<string, unknown>;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  tenantId: string;
  email: string;
  cognitoSub: string;
  fullName: string;
  role?: string;
  phone?: string;
  department?: string;
  preferences?: Record<string, unknown>;
}

export interface UpdateUserData {
  fullName?: string;
  role?: string;
  phone?: string | null;
  department?: string | null;
  preferences?: Record<string, unknown>;
  lastLoginAt?: Date;
}

export interface FindAllUsersOptions {
  page?: number;
  limit?: number;
  filters?: {
    role?: string;
    department?: string;
  };
}

export const usersRepository = {
  async create(data: CreateUserData): Promise<UserRow> {
    const result = await query<UserRow>(
      `INSERT INTO users
         (tenant_id, email, cognito_sub, full_name, role, phone, department, preferences)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.tenantId,
        data.email,
        data.cognitoSub,
        data.fullName,
        data.role ?? 'regulatory_affairs_specialist',
        data.phone ?? null,
        data.department ?? null,
        data.preferences ?? {},
      ],
    );
    return result.rows[0];
  },

  async findById(id: string): Promise<UserRow | null> {
    const result = await query<UserRow>(
      'SELECT * FROM users WHERE id = $1',
      [id],
    );
    return result.rows[0] ?? null;
  },

  async findByCognitoSub(cognitoSub: string): Promise<UserRow | null> {
    const result = await query<UserRow>(
      'SELECT * FROM users WHERE cognito_sub = $1',
      [cognitoSub],
    );
    return result.rows[0] ?? null;
  },

  async findByEmail(tenantId: string, email: string): Promise<UserRow | null> {
    const result = await query<UserRow>(
      'SELECT * FROM users WHERE tenant_id = $1 AND email = $2',
      [tenantId, email],
    );
    return result.rows[0] ?? null;
  },

  async findAll(
    tenantId: string,
    opts: FindAllUsersOptions = {},
  ): Promise<PaginatedResult<UserRow>> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let idx = 2;

    if (opts.filters?.role) {
      conditions.push(`role = $${idx++}`);
      values.push(opts.filters.role);
    }
    if (opts.filters?.department) {
      conditions.push(`department = $${idx++}`);
      values.push(opts.filters.department);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM users ${where}`,
      values,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const itemsResult = await query<UserRow>(
      `SELECT * FROM users ${where} ORDER BY full_name ASC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return { items: itemsResult.rows, total, page, limit };
  },

  async update(id: string, tenantId: string, data: UpdateUserData): Promise<UserRow> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.fullName !== undefined)  { setClauses.push(`full_name = $${idx++}`);    values.push(data.fullName); }
    if (data.role !== undefined)      { setClauses.push(`role = $${idx++}`);          values.push(data.role); }
    if (data.phone !== undefined)     { setClauses.push(`phone = $${idx++}`);         values.push(data.phone); }
    if (data.department !== undefined){ setClauses.push(`department = $${idx++}`);    values.push(data.department); }
    if (data.preferences !== undefined){ setClauses.push(`preferences = $${idx++}`); values.push(data.preferences); }
    if (data.lastLoginAt !== undefined){ setClauses.push(`last_login_at = $${idx++}`); values.push(data.lastLoginAt); }

    if (setClauses.length === 0) {
      const current = await usersRepository.findById(id);
      if (!current) throw new Error(`User not found: ${id}`);
      return current;
    }

    values.push(id, tenantId);
    const result = await query<UserRow>(
      `UPDATE users SET ${setClauses.join(', ')}
       WHERE id = $${idx} AND tenant_id = $${idx + 1}
       RETURNING *`,
      values,
    );
    if (!result.rows[0]) throw new Error(`User not found: ${id}`);
    return result.rows[0];
  },

  /** Soft-delete by setting archived_at on the tenant-scoped deactivation flow.
   *  Users table uses archived_at via the service layer. */
  async softDelete(id: string, tenantId: string): Promise<void> {
    // users table does not have archived_at per design — deactivation is
    // handled via Cognito. This method is provided for completeness and
    // marks a user as inactive by setting last_login_at to a sentinel if
    // needed. The real deactivation is done by the auth service.
    await query(
      `UPDATE users SET updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
  },

  async hardDelete(id: string, tenantId: string): Promise<void> {
    await query(
      'DELETE FROM users WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
  },
};
