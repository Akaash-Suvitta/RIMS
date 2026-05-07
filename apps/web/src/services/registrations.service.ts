import { get, post, patch, del } from '../lib/api';
import type { CursorPage, CreateRegistrationDto, UpdateRegistrationDto, ListRegistrationsQuery } from '@rim/types';
import type { Registration } from '@rim/types';

const BASE = '/api/v1/registrations';

export function listRegistrations(params?: Partial<ListRegistrationsQuery>): Promise<CursorPage<Registration>> {
  const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString() : '';
  return get<CursorPage<Registration>>(`${BASE}${qs}`);
}

export function getRegistration(id: string): Promise<Registration> {
  return get<Registration>(`${BASE}/${id}`);
}

export function createRegistration(data: CreateRegistrationDto): Promise<Registration> {
  return post<Registration>(BASE, data);
}

export function updateRegistration(id: string, data: UpdateRegistrationDto): Promise<Registration> {
  return patch<Registration>(`${BASE}/${id}`, data);
}

export function deleteRegistration(id: string): Promise<void> {
  return del(`${BASE}/${id}/archive`);
}
