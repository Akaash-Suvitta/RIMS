import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ListRegistrationsQuery, CreateRegistrationDto, UpdateRegistrationDto } from '@rim/types';
import {
  listRegistrations,
  getRegistration,
  createRegistration,
  updateRegistration,
  deleteRegistration,
} from '../services/registrations.service';

export function useRegistrations(params?: Partial<ListRegistrationsQuery>) {
  return useQuery({
    queryKey: ['registrations', params ?? {}],
    queryFn: () => listRegistrations(params),
  });
}

export function useRegistration(id: string) {
  return useQuery({
    queryKey: ['registration', id],
    queryFn: () => getRegistration(id),
    enabled: !!id,
  });
}

export function useCreateRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRegistrationDto) => createRegistration(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registrations'] });
    },
  });
}

export function useUpdateRegistration(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateRegistrationDto) => updateRegistration(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registrations'] });
      qc.invalidateQueries({ queryKey: ['registration', id] });
    },
  });
}

export function useDeleteRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRegistration(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registrations'] });
    },
  });
}
