import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateRenewalDto, UpdateRenewalDto, CreateRenewalTaskDto, UpdateRenewalTaskDto } from '@rim/types';
import {
  listRenewals,
  getRenewal,
  createRenewal,
  updateRenewal,
  listRenewalTasks,
  createRenewalTask,
  updateRenewalTask,
} from '../services/renewals.service';

export function useRenewals(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['renewals', params ?? {}],
    queryFn: () => listRenewals(params),
  });
}

export function useRenewal(id: string) {
  return useQuery({
    queryKey: ['renewal', id],
    queryFn: () => getRenewal(id),
    enabled: !!id,
  });
}

export function useCreateRenewal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRenewalDto) => createRenewal(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['renewals'] }),
  });
}

export function useUpdateRenewal(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateRenewalDto) => updateRenewal(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['renewals'] });
      qc.invalidateQueries({ queryKey: ['renewal', id] });
    },
  });
}

export function useRenewalTasks(renewalId: string) {
  return useQuery({
    queryKey: ['renewal', renewalId, 'tasks'],
    queryFn: () => listRenewalTasks(renewalId),
    enabled: !!renewalId,
  });
}

export function useCreateRenewalTask(renewalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRenewalTaskDto) => createRenewalTask(renewalId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['renewal', renewalId, 'tasks'] }),
  });
}

export function useUpdateRenewalTask(renewalId: string, taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateRenewalTaskDto) => updateRenewalTask(renewalId, taskId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['renewal', renewalId, 'tasks'] }),
  });
}
