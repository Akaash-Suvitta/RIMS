import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateLabelDto, UpdateLabelDto, ApproveLabelDto } from '@rim/types';
import {
  listLabels,
  getLabel,
  createLabel,
  updateLabel,
  approveLabel,
} from '../services/labeling.service';

export function useLabels(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['labels', params ?? {}],
    queryFn: () => listLabels(params),
  });
}

export function useLabel(id: string) {
  return useQuery({
    queryKey: ['label', id],
    queryFn: () => getLabel(id),
    enabled: !!id,
  });
}

export function useCreateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLabelDto) => createLabel(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labels'] }),
  });
}

export function useUpdateLabel(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateLabelDto) => updateLabel(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labels'] });
      qc.invalidateQueries({ queryKey: ['label', id] });
    },
  });
}

export function useApproveLabel(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ApproveLabelDto) => approveLabel(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labels'] });
      qc.invalidateQueries({ queryKey: ['label', id] });
    },
  });
}
