import { get, post, patch } from '../lib/api';
import type { CursorPage, CreateLabelDto, UpdateLabelDto, ApproveLabelDto } from '@rim/types';
import type { Label } from '@rim/types';

const BASE = '/api/v1/labels';

export function listLabels(params?: Record<string, string | number>): Promise<CursorPage<Label>> {
  const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString() : '';
  return get<CursorPage<Label>>(`${BASE}${qs}`);
}

export function getLabel(id: string): Promise<Label> {
  return get<Label>(`${BASE}/${id}`);
}

export function createLabel(data: CreateLabelDto): Promise<Label> {
  return post<Label>(BASE, data);
}

export function updateLabel(id: string, data: UpdateLabelDto): Promise<Label> {
  return patch<Label>(`${BASE}/${id}`, data);
}

export function approveLabel(id: string, data: ApproveLabelDto): Promise<Label> {
  return post<Label>(`${BASE}/${id}/approve`, data);
}
