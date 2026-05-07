import { get, post, patch } from '../lib/api';
import type { CursorPage, CreateRenewalDto, UpdateRenewalDto, CreateRenewalTaskDto, UpdateRenewalTaskDto } from '@rim/types';
import type { Renewal, RenewalTask } from '@rim/types';

const BASE = '/api/v1/renewals';

export function listRenewals(params?: Record<string, string | number>): Promise<CursorPage<Renewal>> {
  const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString() : '';
  return get<CursorPage<Renewal>>(`${BASE}${qs}`);
}

export function getRenewal(id: string): Promise<Renewal> {
  return get<Renewal>(`${BASE}/${id}`);
}

export function createRenewal(data: CreateRenewalDto): Promise<Renewal> {
  return post<Renewal>(BASE, data);
}

export function updateRenewal(id: string, data: UpdateRenewalDto): Promise<Renewal> {
  return patch<Renewal>(`${BASE}/${id}`, data);
}

export function listRenewalTasks(renewalId: string): Promise<RenewalTask[]> {
  return get<RenewalTask[]>(`${BASE}/${renewalId}/tasks`);
}

export function createRenewalTask(renewalId: string, data: CreateRenewalTaskDto): Promise<RenewalTask> {
  return post<RenewalTask>(`${BASE}/${renewalId}/tasks`, data);
}

export function updateRenewalTask(renewalId: string, taskId: string, data: UpdateRenewalTaskDto): Promise<RenewalTask> {
  return patch<RenewalTask>(`${BASE}/${renewalId}/tasks/${taskId}`, data);
}
