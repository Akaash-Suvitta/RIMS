'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, Plus } from 'lucide-react';
import { useDossiers } from '../../../hooks/useDossiers';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { Badge, statusToBadgeVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type { Dossier } from '@rim/types';

const columns: Column<Dossier>[] = [
  {
    key: 'title',
    header: 'Title',
    render: (row) => (
      <span className="font-medium" style={{ color: '#E8F0F8' }}>
        {row.title}
      </span>
    ),
  },
  {
    key: 'version',
    header: 'Version',
    render: (row) => (
      <span className="font-mono text-xs" style={{ color: '#7A9BBD' }}>
        v{row.version}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <Badge variant={statusToBadgeVariant(row.status)}>{row.status}</Badge>,
  },
  {
    key: 'createdAt',
    header: 'Created',
    render: (row) => (
      <span className="font-mono text-xs" style={{ color: '#7A9BBD' }}>
        {new Date(row.createdAt).toLocaleDateString()}
      </span>
    ),
  },
];

export default function DossiersPage() {
  const router = useRouter();
  const { data, isLoading } = useDossiers();

  const dossiers = (data as Dossier[] | { data: Dossier[] } | undefined);
  const dossierList: Dossier[] = Array.isArray(dossiers)
    ? dossiers
    : (dossiers as { data?: Dossier[] } | undefined)?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'DM Serif Display, serif', color: '#E8F0F8' }}>
            Dossiers
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>
            Manage regulatory submission dossiers
          </p>
        </div>
        <Button variant="primary" size="md">
          <Plus className="h-4 w-4" />
          New Dossier
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={dossierList}
        isLoading={isLoading}
        emptyMessage="No dossiers yet. Create your first dossier to get started."
        emptyIcon={<BookOpen className="h-8 w-8" />}
        keyExtractor={(r) => r.id}
        onRowClick={(r) => router.push(`/dossiers/${r.id}`)}
      />
    </div>
  );
}
