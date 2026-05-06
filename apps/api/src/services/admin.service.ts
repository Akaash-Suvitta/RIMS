import { usersRepository, tenantsRepository } from '../db/repositories/index.js';
import { createServices } from '../lib/services.js';
import { logAudit } from './audit.service.js';
import { Errors } from '../middleware/error.js';
import type { UserRow } from '../db/repositories/users.js';
import type { TenantRow } from '../db/repositories/tenants.js';
import type { InviteUserDto, UpdateUserRoleDto, CreateTenantDto, UpdateTenantDto } from '@rim/types';

let _services: ReturnType<typeof createServices> | null = null;
function getServices() {
  if (!_services) _services = createServices();
  return _services;
}

// ─── Users (admin-scoped to tenant) ──────────────────────────────────────────

export async function listTenantUsers(
  tenantId: string,
  q: { cursor?: string; limit?: number },
): Promise<{ data: UserRow[]; total: number; nextCursor: string | null }> {
  const limit = q.limit ?? 25;
  const result = await usersRepository.findAll(tenantId, { limit });
  const nextCursor =
    result.items.length === limit ? result.items[result.items.length - 1].id : null;
  return { data: result.items, total: result.total, nextCursor };
}

export async function inviteUser(
  tenantId: string,
  actorId: string,
  dto: InviteUserDto,
  ipAddress?: string,
  userAgent?: string,
): Promise<{ message: string }> {
  // Check for existing user with same email in this tenant
  const existing = await usersRepository.findByEmail(tenantId, dto.email);
  if (existing) throw Errors.conflict(`User with email '${dto.email}' already exists in this organisation.`);

  // Send invitation email (async — fire and forget)
  getServices().email.sendEmail({
    to: dto.email,
    subject: 'You have been invited to RegAxis RIM',
    htmlBody: `<p>You have been invited to join RegAxis RIM with role: <strong>${dto.role}</strong>.</p><p>Click the link to accept your invitation and set up your account.</p>`,
    textBody: `You have been invited to RegAxis RIM with role: ${dto.role}.`,
  }).catch((err: unknown) => {
    console.error('[admin] Failed to send invitation email:', err);
  });

  await logAudit({
    tenantId,
    userId: actorId,
    action: 'create',
    entityType: 'user_invitation',
    entityId: dto.email,
    newValues: { email: dto.email, role: dto.role },
    ipAddress,
    userAgent,
  });

  return { message: 'Invitation sent.' };
}

export async function updateUserRole(
  tenantId: string,
  actorId: string,
  userId: string,
  dto: UpdateUserRoleDto,
  ipAddress?: string,
  userAgent?: string,
): Promise<UserRow> {
  const existing = await usersRepository.findById(userId);
  if (!existing || existing.tenant_id !== tenantId) {
    throw Errors.notFound(`User ${userId} not found.`);
  }

  const updated = await usersRepository.update(userId, tenantId, { role: dto.role });

  await logAudit({
    tenantId,
    userId: actorId,
    action: 'update',
    entityType: 'user',
    entityId: userId,
    oldValues: { role: existing.role },
    newValues: { role: dto.role },
    ipAddress,
    userAgent,
  });

  return updated;
}

export async function deactivateUser(
  tenantId: string,
  actorId: string,
  userId: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  const existing = await usersRepository.findById(userId);
  if (!existing || existing.tenant_id !== tenantId) {
    throw Errors.notFound(`User ${userId} not found.`);
  }
  if (userId === actorId) {
    throw Errors.forbidden('You cannot deactivate your own account.');
  }

  await usersRepository.softDelete(userId, tenantId);

  await logAudit({
    tenantId,
    userId: actorId,
    action: 'delete',
    entityType: 'user',
    entityId: userId,
    oldValues: existing as unknown as Record<string, unknown>,
    ipAddress,
    userAgent,
  });
}

// ─── Tenants (superadmin-scoped) ──────────────────────────────────────────────

export async function listTenants(
  q: { cursor?: string; limit?: number },
): Promise<{ data: TenantRow[]; total: number; nextCursor: string | null }> {
  const limit = q.limit ?? 25;
  const result = await tenantsRepository.findAll({ limit });
  const nextCursor =
    result.items.length === limit ? result.items[result.items.length - 1].id : null;
  return { data: result.items, total: result.total, nextCursor };
}

export async function createTenant(dto: CreateTenantDto): Promise<TenantRow> {
  const existing = await tenantsRepository.findBySlug(dto.slug);
  if (existing) throw Errors.conflict(`Tenant with slug '${dto.slug}' already exists.`);

  return tenantsRepository.create({
    name: dto.name,
    slug: dto.slug,
    plan: dto.plan ?? 'trial',
  });
}

export async function updateTenant(id: string, dto: UpdateTenantDto): Promise<TenantRow> {
  const existing = await tenantsRepository.findById(id);
  if (!existing) throw Errors.notFound(`Tenant ${id} not found.`);

  return tenantsRepository.update(id, {
    name: dto.name,
    plan: dto.plan,
    metadata: dto.metadata,
  });
}
