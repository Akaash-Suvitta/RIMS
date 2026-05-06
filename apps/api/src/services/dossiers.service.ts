import { dossiersRepository } from '../db/repositories/index.js';
import { query } from '../db/client.js';
import { logAudit } from './audit.service.js';
import { Errors } from '../middleware/error.js';
import type { DossierRow } from '../db/repositories/dossiers.js';
import type { CreateDossierDto, UpdateDossierDto, CreateDossierModuleDto } from '@rim/types';

export interface DossierModuleRow {
  id: string;
  tenant_id: string;
  dossier_id: string;
  parent_module_id: string | null;
  module_code: string;
  title: string;
  status: string;
  sort_order: number;
  ai_gap_detected: boolean;
  gap_description: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function listDossiers(
  tenantId: string,
  q: { cursor?: string; limit?: number; product_id?: string; status?: string },
): Promise<{ data: DossierRow[]; total: number; nextCursor: string | null }> {
  const limit = q.limit ?? 25;
  const result = await dossiersRepository.findAll(tenantId, {
    limit,
    filters: { status: q.status, productId: q.product_id },
  });
  const nextCursor =
    result.items.length === limit ? result.items[result.items.length - 1].id : null;
  return { data: result.items, total: result.total, nextCursor };
}

export async function createDossier(
  tenantId: string,
  userId: string,
  dto: CreateDossierDto,
  ipAddress?: string,
  userAgent?: string,
): Promise<DossierRow> {
  const row = await dossiersRepository.create({
    tenantId,
    productId: dto.productId,
    name: dto.name,
    dossierFormat: dto.dossierFormat,
    targetHaId: dto.targetHaId,
    notes: dto.notes,
    createdBy: userId,
  });

  await logAudit({ tenantId, userId, action: 'create', entityType: 'dossier', entityId: row.id, newValues: row as unknown as Record<string, unknown>, ipAddress, userAgent });
  return row;
}

export async function getDossier(id: string, tenantId: string): Promise<DossierRow> {
  const row = await dossiersRepository.findById(id, tenantId);
  if (!row) throw Errors.notFound(`Dossier ${id} not found.`);
  return row;
}

export async function updateDossier(
  id: string,
  tenantId: string,
  userId: string,
  dto: UpdateDossierDto,
  ipAddress?: string,
  userAgent?: string,
): Promise<DossierRow> {
  const existing = await dossiersRepository.findById(id, tenantId);
  if (!existing) throw Errors.notFound(`Dossier ${id} not found.`);

  const updated = await dossiersRepository.update(id, tenantId, {
    name: dto.name,
    dossierFormat: dto.dossierFormat,
    status: dto.status,
    targetHaId: dto.targetHaId,
    notes: dto.notes,
    updatedBy: userId,
  });

  await logAudit({ tenantId, userId, action: 'update', entityType: 'dossier', entityId: id, oldValues: existing as unknown as Record<string, unknown>, newValues: updated as unknown as Record<string, unknown>, ipAddress, userAgent });
  return updated;
}

export async function getDossierSections(
  dossierId: string,
  tenantId: string,
): Promise<DossierModuleRow[]> {
  const result = await query<DossierModuleRow>(
    `SELECT * FROM dossier_modules
     WHERE dossier_id = $1 AND tenant_id = $2
     ORDER BY sort_order ASC, module_code ASC`,
    [dossierId, tenantId],
  );
  return result.rows;
}

export async function createDossierSection(
  dossierId: string,
  tenantId: string,
  _userId: string,
  dto: CreateDossierModuleDto,
): Promise<DossierModuleRow> {
  // Check unique module_code per dossier
  const existing = await query<{ id: string }>(
    'SELECT id FROM dossier_modules WHERE dossier_id = $1 AND module_code = $2',
    [dossierId, dto.moduleCode],
  );
  if (existing.rows.length > 0) {
    throw Errors.conflict(`Module code '${dto.moduleCode}' already exists in this dossier.`);
  }

  const result = await query<DossierModuleRow>(
    `INSERT INTO dossier_modules
       (tenant_id, dossier_id, parent_module_id, module_code, title, status, sort_order, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [tenantId, dossierId, dto.parentModuleId ?? null, dto.moduleCode, dto.title, dto.status ?? 'not_started', dto.sortOrder ?? 0, dto.notes ?? null],
  );
  return result.rows[0];
}
