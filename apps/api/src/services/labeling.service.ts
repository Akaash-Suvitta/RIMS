import { query } from '../db/client.js';
import { logAudit } from './audit.service.js';
import { Errors } from '../middleware/error.js';
import type { CreateLabelDto, UpdateLabelDto, ApproveLabelDto } from '@rim/types';

export interface LabelRow {
  id: string;
  tenant_id: string;
  product_id: string;
  market_id: string | null;
  label_type: string;
  status: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface LabelVersionRow {
  id: string;
  tenant_id: string;
  label_id: string;
  document_id: string | null;
  version_number: number;
  version_label: string | null;
  status: string;
  change_summary: string | null;
  ai_harmonized: boolean;
  ai_harmonized_at: Date | null;
  approved_by: string | null;
  approved_at: Date | null;
  created_at: Date;
}

export async function listLabels(
  tenantId: string,
  q: { cursor?: string; limit?: number; product_id?: string; market_id?: string; status?: string; label_type?: string },
): Promise<{ data: LabelRow[]; total: number; nextCursor: string | null }> {
  const limit = q.limit ?? 25;

  const conditions: string[] = ['tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let idx = 2;

  if (q.product_id)  { conditions.push(`product_id = $${idx++}`);  values.push(q.product_id); }
  if (q.market_id)   { conditions.push(`market_id = $${idx++}`);   values.push(q.market_id); }
  if (q.status)      { conditions.push(`status = $${idx++}`);      values.push(q.status); }
  if (q.label_type)  { conditions.push(`label_type = $${idx++}`);  values.push(q.label_type); }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM labels ${where}`,
    values,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const itemsResult = await query<LabelRow>(
    `SELECT * FROM labels ${where}
     ORDER BY created_at DESC
     LIMIT $${idx} OFFSET 0`,
    [...values, limit],
  );

  const nextCursor =
    itemsResult.rows.length === limit
      ? itemsResult.rows[itemsResult.rows.length - 1].id
      : null;

  return { data: itemsResult.rows, total, nextCursor };
}

export async function createLabel(
  tenantId: string,
  userId: string,
  dto: CreateLabelDto,
  ipAddress?: string,
  userAgent?: string,
): Promise<LabelRow> {
  // Check for duplicate (unique on tenant_id, product_id, label_type, market_id)
  const existing = await query<{ id: string }>(
    `SELECT id FROM labels
     WHERE tenant_id = $1 AND product_id = $2 AND label_type = $3
       AND (market_id = $4 OR (market_id IS NULL AND $4::uuid IS NULL))`,
    [tenantId, dto.productId, dto.labelType, dto.marketId ?? null],
  );
  if (existing.rows.length > 0) {
    throw Errors.conflict(`A ${dto.labelType} label for this product and market already exists.`);
  }

  const result = await query<LabelRow>(
    `INSERT INTO labels (tenant_id, product_id, market_id, label_type, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [tenantId, dto.productId, dto.marketId ?? null, dto.labelType, dto.status ?? 'draft', userId],
  );

  const row = result.rows[0];
  await logAudit({ tenantId, userId, action: 'create', entityType: 'label', entityId: row.id, newValues: row as unknown as Record<string, unknown>, ipAddress, userAgent });
  return row;
}

export async function getLabel(
  id: string,
  tenantId: string,
): Promise<LabelRow & { versions: LabelVersionRow[] }> {
  const labelResult = await query<LabelRow>(
    'SELECT * FROM labels WHERE id = $1 AND tenant_id = $2',
    [id, tenantId],
  );
  const label = labelResult.rows[0];
  if (!label) throw Errors.notFound(`Label ${id} not found.`);

  const versionsResult = await query<LabelVersionRow>(
    'SELECT * FROM label_versions WHERE label_id = $1 ORDER BY version_number ASC',
    [id],
  );

  return { ...label, versions: versionsResult.rows };
}

export async function updateLabel(
  id: string,
  tenantId: string,
  userId: string,
  dto: UpdateLabelDto,
  ipAddress?: string,
  userAgent?: string,
): Promise<LabelRow> {
  const existing = await query<LabelRow>(
    'SELECT * FROM labels WHERE id = $1 AND tenant_id = $2',
    [id, tenantId],
  );
  if (!existing.rows[0]) throw Errors.notFound(`Label ${id} not found.`);

  const setClauses: string[] = ['updated_by = $1', 'updated_at = NOW()'];
  const values: unknown[] = [userId];
  let idx = 2;

  if (dto.status !== undefined)   { setClauses.push(`status = $${idx++}`);    values.push(dto.status); }
  if (dto.marketId !== undefined)  { setClauses.push(`market_id = $${idx++}`); values.push(dto.marketId); }

  values.push(id, tenantId);
  const result = await query<LabelRow>(
    `UPDATE labels SET ${setClauses.join(', ')}
     WHERE id = $${idx} AND tenant_id = $${idx + 1}
     RETURNING *`,
    values,
  );

  const updated = result.rows[0];
  await logAudit({ tenantId, userId, action: 'update', entityType: 'label', entityId: id, oldValues: existing.rows[0] as unknown as Record<string, unknown>, newValues: updated as unknown as Record<string, unknown>, ipAddress, userAgent });
  return updated;
}

export async function approveLabel(
  id: string,
  tenantId: string,
  userId: string,
  dto: ApproveLabelDto,
  ipAddress?: string,
  userAgent?: string,
): Promise<LabelVersionRow> {
  const labelResult = await query<LabelRow>(
    'SELECT * FROM labels WHERE id = $1 AND tenant_id = $2',
    [id, tenantId],
  );
  if (!labelResult.rows[0]) throw Errors.notFound(`Label ${id} not found.`);

  const versionResult = await query<LabelVersionRow>(
    'SELECT * FROM label_versions WHERE id = $1 AND label_id = $2',
    [dto.versionId, id],
  );
  if (!versionResult.rows[0]) throw Errors.notFound(`Label version ${dto.versionId} not found.`);

  const result = await query<LabelVersionRow>(
    `UPDATE label_versions
     SET approved_by = $1, approved_at = NOW(), status = 'approved'
     WHERE id = $2
     RETURNING *`,
    [userId, dto.versionId],
  );

  // Also update parent label status
  await query(
    `UPDATE labels SET status = 'approved', updated_by = $1, updated_at = NOW()
     WHERE id = $2 AND tenant_id = $3`,
    [userId, id, tenantId],
  );

  await logAudit({ tenantId, userId, action: 'update', entityType: 'label_version', entityId: dto.versionId, ipAddress, userAgent });
  return result.rows[0];
}
