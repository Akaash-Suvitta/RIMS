import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadDocument, deleteDocument, getDownloadUrl } from '../services/documents.service';

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      context,
    }: {
      file: File;
      context?: { type: 'dossier_section' | 'submission'; id: string };
    }) => uploadDocument(file, { context }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useGetDownloadUrl() {
  return useMutation({
    mutationFn: (id: string) => getDownloadUrl(id),
  });
}
