import { get, post, patch } from '../lib/api';
import type { CursorPage, CreateDossierDto, UpdateDossierDto, CreateDossierModuleDto } from '@rim/types';
import type { Dossier, DossierSection } from '@rim/types';

const BASE = '/api/v1/dossiers';

export function listDossiers(params?: Record<string, string | number>): Promise<CursorPage<Dossier>> {
  const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString() : '';
  return get<CursorPage<Dossier>>(`${BASE}${qs}`);
}

export function getDossier(id: string): Promise<Dossier> {
  return get<Dossier>(`${BASE}/${id}`);
}

export function createDossier(data: CreateDossierDto): Promise<Dossier> {
  return post<Dossier>(BASE, data);
}

export function updateDossier(id: string, data: UpdateDossierDto): Promise<Dossier> {
  return patch<Dossier>(`${BASE}/${id}`, data);
}

export function listDossierSections(dossierId: string): Promise<DossierSection[]> {
  return get<DossierSection[]>(`${BASE}/${dossierId}/sections`);
}

export function createDossierSection(dossierId: string, data: CreateDossierModuleDto): Promise<DossierSection> {
  return post<DossierSection>(`${BASE}/${dossierId}/sections`, data);
}
