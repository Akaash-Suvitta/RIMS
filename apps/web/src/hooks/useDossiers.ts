import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateDossierDto, UpdateDossierDto, CreateDossierModuleDto } from '@rim/types';
import {
  listDossiers,
  getDossier,
  createDossier,
  updateDossier,
  listDossierSections,
  createDossierSection,
} from '../services/dossiers.service';

export function useDossiers(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['dossiers', params ?? {}],
    queryFn: () => listDossiers(params),
  });
}

export function useDossier(id: string) {
  return useQuery({
    queryKey: ['dossier', id],
    queryFn: () => getDossier(id),
    enabled: !!id,
  });
}

export function useCreateDossier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDossierDto) => createDossier(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dossiers'] }),
  });
}

export function useUpdateDossier(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateDossierDto) => updateDossier(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dossiers'] });
      qc.invalidateQueries({ queryKey: ['dossier', id] });
    },
  });
}

export function useDossierSections(dossierId: string) {
  return useQuery({
    queryKey: ['dossier', dossierId, 'sections'],
    queryFn: () => listDossierSections(dossierId),
    enabled: !!dossierId,
  });
}

export function useCreateDossierSection(dossierId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDossierModuleDto) => createDossierSection(dossierId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dossier', dossierId, 'sections'] }),
  });
}
