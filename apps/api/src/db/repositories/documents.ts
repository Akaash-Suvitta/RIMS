import { query } from '../client.js';
import type { PaginatedResult } from './tenants.js';

export interface DocumentRow {
  id: string;
  tenant_id: string;
  file_name: string;
  display_name: string | null;
  file_path: string;
  mime_type: string;
  file_size_bytes: number | null;
  checksum_sha256: string | null;
  document_status: string;
  version: number;
  previous_version_id: string | null;
  tags: string[];
  ai_indexed: boolean;
  ai_indexed_at: Date | null;
  is_archived: boolean;
  metadata: Record<string, unknown>;
  uploaded_by: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDocumentData {
  tenantId: string;
  fileName: string;
  displayName?: string;
  filePath: string;
  mimeType: string;
  fileSizeBytes?: number;
  checksumSha256?: string;
  documentStatus?: string;
  version?: number;
  previousVersionId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  uploadedBy?: string;
  createdBy?: string;
}

export interface UpdateDocumentData {
  displayName?: string | null;
  documentStatus?: string;
  tags?: string[];
  aiIndexed?: boolean;
  aiIndexedAt?: Date | null;
  isArchived?: boolean;
  metadata?: Record<string, unknown>;
}

export interface FindAllDocumentsOptions {
  page?: number;
  limit?: number;
  includeArchived?: boolean;
  filters?: {
    documentStatus?: string;
    tags?: string[];
    mimeType?: string;
  };
}

export const documentsRepository = {
  async create(data: CreateDocumentData): Promise<DocumentRow> {
    const result = await query<DocumentRow>(
      `INSERT INTO documents
         (tenant_id, file_name, display_name, file_path, mime_type,
          file_size_bytes, checksum_sha256, document_status, version,
          previous_version_id, tags, metadata, uploaded_by, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        data.tenantId,
        data.fileName,
        data.displayName ?? null,
        data.filePath,
        data.mimeType,
        data.fileSizeBytes ?? null,
        data.checksumSha256 ?? null,
        data.documentStatus ?? 'draft',
        data.version ?? 1,
        data.previousVersionId ?? null,
        data.tags ?? [],
        data.metadata ?? {},
        data.uploadedBy ?? null,
        data.createdBy ?? null,
      ],
    );
    return result.rows[0];
  },

  async findById(id: string, tenantId: string): Promise<DocumentRow | null> {
    const result = await query<DocumentRow>(
      'SELECT * FROM documents WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
    return result.rows[0] ?? null;
  },

  async findAll(
    tenantId: string,
    opts: FindAllDocumentsOptions = {},
  ): Promise<PaginatedResult<DocumentRow>> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let idx = 2;

    if (!opts.includeArchived) {
      conditions.push('is_archived = FALSE');
    }
    if (opts.filters?.documentStatus) {
      conditions.push(`document_status = $${idx++}`);
      values.push(opts.filters.documentStatus);
    }
    if (opts.filters?.mimeType) {
      conditions.push(`mime_type = $${idx++}`);
      values.push(opts.filters.mimeType);
    }
    if (opts.filters?.tags && opts.filters.tags.length > 0) {
      conditions.push(`tags && $${idx++}`);
      values.push(opts.filters.tags);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM documents ${where}`,
      values,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const itemsResult = await query<DocumentRow>(
      `SELECT * FROM documents ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return { items: itemsResult.rows, total, page, limit };
  },

  async update(id: string, tenantId: string, data: UpdateDocumentData): Promise<DocumentRow> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.displayName !== undefined)    { setClauses.push(`display_name = $${idx++}`);    values.push(data.displayName); }
    if (data.documentStatus !== undefined) { setClauses.push(`document_status = $${idx++}`); values.push(data.documentStatus); }
    if (data.tags !== undefined)           { setClauses.push(`tags = $${idx++}`);            values.push(data.tags); }
    if (data.aiIndexed !== undefined)      { setClauses.push(`ai_indexed = $${idx++}`);      values.push(data.aiIndexed); }
    if (data.aiIndexedAt !== undefined)    { setClauses.push(`ai_indexed_at = $${idx++}`);   values.push(data.aiIndexedAt); }
    if (data.isArchived !== undefined)     { setClauses.push(`is_archived = $${idx++}`);     values.push(data.isArchived); }
    if (data.metadata !== undefined)       { setClauses.push(`metadata = $${idx++}`);        values.push(data.metadata); }

    if (setClauses.length === 0) {
      const current = await documentsRepository.findById(id, tenantId);
      if (!current) throw new Error(`Document not found: ${id}`);
      return current;
    }

    values.push(id, tenantId);
    const result = await query<DocumentRow>(
      `UPDATE documents SET ${setClauses.join(', ')}
       WHERE id = $${idx} AND tenant_id = $${idx + 1}
       RETURNING *`,
      values,
    );
    if (!result.rows[0]) throw new Error(`Document not found: ${id}`);
    return result.rows[0];
  },

  /** Documents use is_archived boolean per TR-F-054 */
  async softDelete(id: string, tenantId: string): Promise<void> {
    await query(
      `UPDATE documents SET is_archived = TRUE, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
  },
};
