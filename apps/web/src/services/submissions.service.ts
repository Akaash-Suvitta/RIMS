import { get, post, patch } from '../lib/api';
import type { CursorPage, CreateSubmissionDto, UpdateSubmissionDto } from '@rim/types';
import type { Submission } from '@rim/types';

const BASE = '/api/v1/submissions';

export function listSubmissions(params?: Record<string, string | number>): Promise<CursorPage<Submission>> {
  const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString() : '';
  return get<CursorPage<Submission>>(`${BASE}${qs}`);
}

export function getSubmission(id: string): Promise<Submission> {
  return get<Submission>(`${BASE}/${id}`);
}

export function createSubmission(data: CreateSubmissionDto): Promise<Submission> {
  return post<Submission>(BASE, data);
}

export function updateSubmission(id: string, data: UpdateSubmissionDto): Promise<Submission> {
  return patch<Submission>(`${BASE}/${id}`, data);
}
