import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateSubmissionDto, UpdateSubmissionDto } from '@rim/types';
import {
  listSubmissions,
  getSubmission,
  createSubmission,
  updateSubmission,
} from '../services/submissions.service';

export function useSubmissions(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['submissions', params ?? {}],
    queryFn: () => listSubmissions(params),
  });
}

export function useSubmission(id: string) {
  return useQuery({
    queryKey: ['submission', id],
    queryFn: () => getSubmission(id),
    enabled: !!id,
  });
}

export function useCreateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubmissionDto) => createSubmission(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] }),
  });
}

export function useUpdateSubmission(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSubmissionDto) => updateSubmission(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submissions'] });
      qc.invalidateQueries({ queryKey: ['submission', id] });
    },
  });
}
