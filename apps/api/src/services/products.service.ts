import { productsRepository } from '../db/repositories/index.js';
import { logAudit } from './audit.service.js';
import { Errors } from '../middleware/error.js';
import type { ProductRow } from '../db/repositories/products.js';
import type { CreateProductDto, UpdateProductDto } from '@rim/types';

export async function listProducts(
  tenantId: string,
  q: { cursor?: string; limit?: number; product_type?: string; therapeutic_area?: string },
): Promise<{ data: ProductRow[]; total: number; nextCursor: string | null }> {
  const limit = q.limit ?? 25;
  const result = await productsRepository.findAll(tenantId, {
    limit,
    filters: {
      productType: q.product_type,
      therapeuticArea: q.therapeutic_area,
    },
  });
  const nextCursor =
    result.items.length === limit ? result.items[result.items.length - 1].id : null;
  return { data: result.items, total: result.total, nextCursor };
}

export async function createProduct(
  tenantId: string,
  userId: string,
  dto: CreateProductDto,
  ipAddress?: string,
  userAgent?: string,
): Promise<ProductRow> {
  const row = await productsRepository.create({
    tenantId,
    name: dto.name,
    brandName: dto.brandName,
    internalCode: dto.internalCode,
    inn: dto.inn,
    atcCode: dto.atcCode,
    productType: dto.productType,
    therapeuticArea: dto.therapeuticArea,
    dosageForm: dto.dosageForm,
    strength: dto.strength,
    routeOfAdmin: dto.routeOfAdmin,
    createdBy: userId,
  });

  await logAudit({ tenantId, userId, action: 'create', entityType: 'product', entityId: row.id, newValues: row as unknown as Record<string, unknown>, ipAddress, userAgent });
  return row;
}

export async function getProduct(id: string, tenantId: string): Promise<ProductRow> {
  const row = await productsRepository.findById(id, tenantId);
  if (!row) throw Errors.notFound(`Product ${id} not found.`);
  return row;
}

export async function updateProduct(
  id: string,
  tenantId: string,
  userId: string,
  dto: UpdateProductDto,
  ipAddress?: string,
  userAgent?: string,
): Promise<ProductRow> {
  const existing = await productsRepository.findById(id, tenantId);
  if (!existing) throw Errors.notFound(`Product ${id} not found.`);

  const updated = await productsRepository.update(id, tenantId, {
    name: dto.name,
    brandName: dto.brandName,
    internalCode: dto.internalCode,
    inn: dto.inn,
    atcCode: dto.atcCode,
    productType: dto.productType,
    therapeuticArea: dto.therapeuticArea,
    dosageForm: dto.dosageForm,
    strength: dto.strength,
    routeOfAdmin: dto.routeOfAdmin,
    updatedBy: userId,
  });

  await logAudit({ tenantId, userId, action: 'update', entityType: 'product', entityId: id, oldValues: existing as unknown as Record<string, unknown>, newValues: updated as unknown as Record<string, unknown>, ipAddress, userAgent });
  return updated;
}
