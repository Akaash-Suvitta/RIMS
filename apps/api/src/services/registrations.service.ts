import { registrationsRepository } from '../db/repositories/index.js';
import { logAudit } from './audit.service.js';
import { Errors } from '../middleware/error.js';
import type { RegistrationRow } from '../db/repositories/registrations.js';
import type { CreateRegistrationDto, UpdateRegistrationDto } from '@rim/types';

// Valid status transitions: current → allowed next statuses
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:   ['active', 'suspended'],
  active:    ['suspended', 'lapsed', 'pending'],
  suspended: ['active', 'lapsed'],
  lapsed:    ['active'],
  archived:  [],
};

function toDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  return new Date(value);
}

export async function listRegistrations(
  tenantId: string,
  query: {
    cursor?: string;
    limit?: number;
    status?: string;
    market_id?: string;
    product_id?: string;
    ha_id?: string;
    expiring_within_days?: number;
  },
): Promise<{ data: RegistrationRow[]; total: number; nextCursor: string | null }> {
  const limit = query.limit ?? 25;
  const result = await registrationsRepository.findAll(tenantId, {
    limit,
    filters: {
      status: query.status,
      countryId: query.market_id,
      productId: query.product_id,
      haId: query.ha_id,
    },
  });

  const nextCursor =
    result.items.length === limit ? result.items[result.items.length - 1].id : null;

  return { data: result.items, total: result.total, nextCursor };
}

export async function createRegistration(
  tenantId: string,
  userId: string,
  dto: CreateRegistrationDto,
  ipAddress?: string,
  userAgent?: string,
): Promise<RegistrationRow> {
  const row = await registrationsRepository.create({
    tenantId,
    productId: dto.productId,
    countryId: dto.marketId,
    haId: dto.haId,
    registrationNumber: dto.registrationNumber,
    registrationType: dto.registrationType,
    status: dto.status ?? 'pending',
    approvalDate: toDate(dto.approvalDate),
    expiryDate: toDate(dto.expiryDate),
    nextRenewalDue: toDate(dto.nextRenewalDue),
    ownerUserId: dto.ownerUserId,
    lifecycleStage: dto.lifecycleStage,
    notes: dto.notes,
    createdBy: userId,
  });

  await logAudit({
    tenantId,
    userId,
    action: 'create',
    entityType: 'registration',
    entityId: row.id,
    newValues: row as unknown as Record<string, unknown>,
    ipAddress,
    userAgent,
  });

  return row;
}

export async function getRegistration(
  id: string,
  tenantId: string,
): Promise<RegistrationRow> {
  const row = await registrationsRepository.findById(id, tenantId);
  if (!row) throw Errors.notFound(`Registration ${id} not found.`);
  return row;
}

export async function updateRegistration(
  id: string,
  tenantId: string,
  userId: string,
  dto: UpdateRegistrationDto,
  ipAddress?: string,
  userAgent?: string,
): Promise<RegistrationRow> {
  const existing = await registrationsRepository.findById(id, tenantId);
  if (!existing) throw Errors.notFound(`Registration ${id} not found.`);

  // Validate status transition
  if (dto.status && dto.status !== existing.status) {
    const allowed = VALID_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw Errors.unprocessable(
        `Cannot transition registration from '${existing.status}' to '${dto.status}'.`,
      );
    }
  }

  const updated = await registrationsRepository.update(id, tenantId, {
    registrationNumber: dto.registrationNumber,
    registrationType: dto.registrationType,
    status: dto.status,
    approvalDate: dto.approvalDate !== undefined ? (dto.approvalDate ? new Date(dto.approvalDate) : null) : undefined,
    expiryDate: dto.expiryDate !== undefined ? (dto.expiryDate ? new Date(dto.expiryDate) : null) : undefined,
    nextRenewalDue: dto.nextRenewalDue !== undefined ? (dto.nextRenewalDue ? new Date(dto.nextRenewalDue) : null) : undefined,
    ownerUserId: dto.ownerUserId,
    lifecycleStage: dto.lifecycleStage,
    notes: dto.notes,
    renewalInitiated: dto.renewalInitiated,
    updatedBy: userId,
  });

  await logAudit({
    tenantId,
    userId,
    action: 'update',
    entityType: 'registration',
    entityId: id,
    oldValues: existing as unknown as Record<string, unknown>,
    newValues: updated as unknown as Record<string, unknown>,
    ipAddress,
    userAgent,
  });

  return updated;
}

export async function archiveRegistration(
  id: string,
  tenantId: string,
  userId: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  const existing = await registrationsRepository.findById(id, tenantId);
  if (!existing) throw Errors.notFound(`Registration ${id} not found.`);
  if (existing.archived_at) throw Errors.conflict('Registration is already archived.');

  await registrationsRepository.softDelete(id, tenantId, userId);

  await logAudit({
    tenantId,
    userId,
    action: 'archive',
    entityType: 'registration',
    entityId: id,
    oldValues: existing as unknown as Record<string, unknown>,
    ipAddress,
    userAgent,
  });
}
