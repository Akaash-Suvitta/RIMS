import { query } from '../client.js';
import type { PaginatedResult } from './tenants.js';

export interface ProductRow {
  id: string;
  tenant_id: string;
  name: string;
  brand_name: string | null;
  internal_code: string | null;
  inn: string | null;
  atc_code: string | null;
  product_type: string;
  therapeutic_area: string | null;
  dosage_form: string | null;
  strength: string | null;
  route_of_admin: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
}

export interface CreateProductData {
  tenantId: string;
  name: string;
  brandName?: string;
  internalCode?: string;
  inn?: string;
  atcCode?: string;
  productType?: string;
  therapeuticArea?: string;
  dosageForm?: string;
  strength?: string;
  routeOfAdmin?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
}

export interface UpdateProductData {
  name?: string;
  brandName?: string | null;
  internalCode?: string | null;
  inn?: string | null;
  atcCode?: string | null;
  productType?: string;
  therapeuticArea?: string | null;
  dosageForm?: string | null;
  strength?: string | null;
  routeOfAdmin?: string | null;
  metadata?: Record<string, unknown>;
  updatedBy?: string;
}

export interface FindAllProductsOptions {
  page?: number;
  limit?: number;
  includeArchived?: boolean;
  filters?: {
    productType?: string;
    therapeuticArea?: string;
  };
}

export const productsRepository = {
  async create(data: CreateProductData): Promise<ProductRow> {
    const result = await query<ProductRow>(
      `INSERT INTO products
         (tenant_id, name, brand_name, internal_code, inn, atc_code,
          product_type, therapeutic_area, dosage_form, strength,
          route_of_admin, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        data.tenantId,
        data.name,
        data.brandName ?? null,
        data.internalCode ?? null,
        data.inn ?? null,
        data.atcCode ?? null,
        data.productType ?? 'small_molecule',
        data.therapeuticArea ?? null,
        data.dosageForm ?? null,
        data.strength ?? null,
        data.routeOfAdmin ?? null,
        data.metadata ?? {},
        data.createdBy ?? null,
      ],
    );
    return result.rows[0];
  },

  async findById(id: string, tenantId: string): Promise<ProductRow | null> {
    const result = await query<ProductRow>(
      'SELECT * FROM products WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
    return result.rows[0] ?? null;
  },

  async findAll(
    tenantId: string,
    opts: FindAllProductsOptions = {},
  ): Promise<PaginatedResult<ProductRow>> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let idx = 2;

    if (!opts.includeArchived) {
      conditions.push('archived_at IS NULL');
    }
    if (opts.filters?.productType) {
      conditions.push(`product_type = $${idx++}`);
      values.push(opts.filters.productType);
    }
    if (opts.filters?.therapeuticArea) {
      conditions.push(`therapeutic_area = $${idx++}`);
      values.push(opts.filters.therapeuticArea);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM products ${where}`,
      values,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const itemsResult = await query<ProductRow>(
      `SELECT * FROM products ${where} ORDER BY name ASC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return { items: itemsResult.rows, total, page, limit };
  },

  async update(id: string, tenantId: string, data: UpdateProductData): Promise<ProductRow> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined)           { setClauses.push(`name = $${idx++}`);            values.push(data.name); }
    if (data.brandName !== undefined)      { setClauses.push(`brand_name = $${idx++}`);       values.push(data.brandName); }
    if (data.internalCode !== undefined)   { setClauses.push(`internal_code = $${idx++}`);    values.push(data.internalCode); }
    if (data.inn !== undefined)            { setClauses.push(`inn = $${idx++}`);              values.push(data.inn); }
    if (data.atcCode !== undefined)        { setClauses.push(`atc_code = $${idx++}`);         values.push(data.atcCode); }
    if (data.productType !== undefined)    { setClauses.push(`product_type = $${idx++}`);     values.push(data.productType); }
    if (data.therapeuticArea !== undefined){ setClauses.push(`therapeutic_area = $${idx++}`); values.push(data.therapeuticArea); }
    if (data.dosageForm !== undefined)     { setClauses.push(`dosage_form = $${idx++}`);      values.push(data.dosageForm); }
    if (data.strength !== undefined)       { setClauses.push(`strength = $${idx++}`);         values.push(data.strength); }
    if (data.routeOfAdmin !== undefined)   { setClauses.push(`route_of_admin = $${idx++}`);   values.push(data.routeOfAdmin); }
    if (data.metadata !== undefined)       { setClauses.push(`metadata = $${idx++}`);         values.push(data.metadata); }
    if (data.updatedBy !== undefined)      { setClauses.push(`updated_by = $${idx++}`);       values.push(data.updatedBy); }

    if (setClauses.length === 0) {
      const current = await productsRepository.findById(id, tenantId);
      if (!current) throw new Error(`Product not found: ${id}`);
      return current;
    }

    values.push(id, tenantId);
    const result = await query<ProductRow>(
      `UPDATE products SET ${setClauses.join(', ')}
       WHERE id = $${idx} AND tenant_id = $${idx + 1}
       RETURNING *`,
      values,
    );
    if (!result.rows[0]) throw new Error(`Product not found: ${id}`);
    return result.rows[0];
  },

  async softDelete(id: string, tenantId: string, updatedBy?: string): Promise<void> {
    await query(
      `UPDATE products SET archived_at = NOW(), updated_by = $3
       WHERE id = $1 AND tenant_id = $2 AND archived_at IS NULL`,
      [id, tenantId, updatedBy ?? null],
    );
  },
};
