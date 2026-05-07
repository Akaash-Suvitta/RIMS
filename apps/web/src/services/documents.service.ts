import { get, post, del, upload } from '../lib/api';
import type { DocumentUploadUrlDto, ConfirmUploadDto } from '@rim/types';
import type { Document } from '@rim/types';

const BASE = '/api/v1/documents';

interface UploadUrlResponse {
  uploadUrl: string;
  documentId: string;
}

interface DownloadUrlResponse {
  url: string;
  expiresAt: string;
}

export function requestUploadUrl(data: DocumentUploadUrlDto): Promise<UploadUrlResponse> {
  return post<UploadUrlResponse>(`${BASE}/upload-url`, data);
}

export function confirmUpload(data: ConfirmUploadDto): Promise<Document> {
  return post<Document>(`${BASE}/confirm-upload`, data);
}

export function getDownloadUrl(id: string): Promise<DownloadUrlResponse> {
  return get<DownloadUrlResponse>(`${BASE}/${id}/download-url`);
}

export function deleteDocument(id: string): Promise<void> {
  return del(`${BASE}/${id}`);
}

/**
 * Full upload flow: request presigned URL → PUT to S3 → confirm.
 */
export async function uploadDocument(
  file: File,
  metadata: { context?: { type: 'dossier_section' | 'submission'; id: string } },
): Promise<Document> {
  // 1. Request presigned PUT URL
  const { uploadUrl, documentId } = await requestUploadUrl({
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    context: metadata.context,
  });

  // 2. PUT file directly to S3
  const s3Response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
  });

  if (!s3Response.ok) {
    throw new Error('Failed to upload file to storage.');
  }

  // 3. Confirm the upload
  return confirmUpload({ documentId });
}
