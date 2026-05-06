import { documentsRepository } from '../db/repositories/index.js';
import { createServices } from '../lib/services.js';
import { env } from '../lib/config.js';
import { logAudit } from './audit.service.js';
import { Errors } from '../middleware/error.js';
import type { DocumentRow } from '../db/repositories/documents.js';
import type { DocumentUploadUrlDto, ConfirmUploadDto } from '@rim/types';

const DEMO_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const DEMO_MAX_ORG_BYTES  = 1024 * 1024 * 1024; // 1 GB

let _services: ReturnType<typeof createServices> | null = null;
function getServices() {
  if (!_services) _services = createServices();
  return _services;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export async function generateUploadUrl(
  tenantId: string,
  userId: string,
  dto: DocumentUploadUrlDto,
): Promise<{ uploadUrl: string; documentId: string }> {
  // Demo tier: per-file and per-org size checks
  if (env.isDemo) {
    if (dto.sizeBytes > DEMO_MAX_FILE_BYTES) {
      throw Errors.demoLimit(
        'File exceeds the 10 MB demo upload limit.',
        '10 MB',
        formatBytes(dto.sizeBytes),
      );
    }

    // Check org-level storage quota
    const { query } = getServices().db;
    const quotaResult = await query<{ total: string }>(
      `SELECT COALESCE(SUM(file_size_bytes), 0) AS total
       FROM documents
       WHERE tenant_id = $1 AND is_archived = FALSE`,
      [tenantId],
    );
    const usedBytes = parseInt(quotaResult.rows[0]?.total ?? '0', 10);
    if (usedBytes + dto.sizeBytes > DEMO_MAX_ORG_BYTES) {
      throw Errors.demoLimit(
        'Organisation storage quota exceeded (1 GB demo limit).',
        '1 GB',
        formatBytes(usedBytes),
      );
    }
  }

  // Build S3 key: {tenantId}/{context.type}/{context.id}/{uuid}/{fileName}
  const uuid = crypto.randomUUID();
  const contextPath = dto.context
    ? `${dto.context.type}/${dto.context.id}/`
    : 'unlinked/';
  const s3Key = `${tenantId}/${contextPath}${uuid}/${dto.fileName}`;

  // Pre-create document record in 'draft' status
  const doc = await documentsRepository.create({
    tenantId,
    fileName: dto.fileName,
    displayName: dto.fileName,
    filePath: s3Key,
    mimeType: dto.mimeType,
    fileSizeBytes: dto.sizeBytes,
    documentStatus: 'draft',
    uploadedBy: userId,
    createdBy: userId,
  });

  // Generate pre-signed PUT URL
  const uploadUrl = await getServices().storage.getPresignedUploadUrl(
    s3Key,
    dto.mimeType,
    dto.sizeBytes,
  );

  return { uploadUrl, documentId: doc.id };
}

export async function confirmUpload(
  tenantId: string,
  dto: ConfirmUploadDto,
): Promise<DocumentRow> {
  const doc = await documentsRepository.findById(dto.documentId, tenantId);
  if (!doc) throw Errors.notFound(`Document ${dto.documentId} not found.`);

  const updated = await documentsRepository.update(dto.documentId, tenantId, {
    documentStatus: 'uploaded',
  });

  return updated;
}

export async function getDownloadUrl(
  id: string,
  tenantId: string,
): Promise<{ url: string; expiresAt: string }> {
  const doc = await documentsRepository.findById(id, tenantId);
  if (!doc || doc.is_archived) throw Errors.notFound(`Document ${id} not found.`);

  const url = await getServices().storage.getPresignedDownloadUrl(doc.file_path);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

  return { url, expiresAt };
}

export async function archiveDocument(
  id: string,
  tenantId: string,
  userId: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  const doc = await documentsRepository.findById(id, tenantId);
  if (!doc) throw Errors.notFound(`Document ${id} not found.`);
  if (doc.is_archived) throw Errors.conflict('Document is already archived.');

  await documentsRepository.softDelete(id, tenantId);

  await logAudit({ tenantId, userId, action: 'archive', entityType: 'document', entityId: id, oldValues: doc as unknown as Record<string, unknown>, ipAddress, userAgent });
}

export async function listDocuments(
  tenantId: string,
  q: { cursor?: string; limit?: number },
): Promise<{ data: DocumentRow[]; total: number; nextCursor: string | null }> {
  const limit = q.limit ?? 25;
  const result = await documentsRepository.findAll(tenantId, { limit });
  const nextCursor =
    result.items.length === limit ? result.items[result.items.length - 1].id : null;
  return { data: result.items, total: result.total, nextCursor };
}
