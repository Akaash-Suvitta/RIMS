'use client';

import { useRouter } from 'next/navigation';
import { Archive, AlertTriangle } from 'lucide-react';
import { useRegistrations } from '../../../hooks/useRegistrations';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { Badge, statusToBadgeVariant } from '../../../components/ui/Badge';
import type { Registration } from '@rim/types';

const columns: Column<Registration>[] = [
  {
    key: 'licenseNumber',
    header: 'License / ID',
    render: (row) => (
      <span className="font-mono text-xs" style={{ color: '#38BDF8' }}>
        {row.registrationNumber ?? row.id.slice(0, 8)}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <Badge variant={statusToBadgeVariant(row.status)}>{row.status}</Badge>,
  },
  {
    key: 'expiryDate',
    header: 'Expiry Date',
    render: (row) => (
      <span className="font-mono text-xs" style={{ color: '#7A9BBD' }}>
        {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '—'}
      </span>
    ),
  },
  {
    key: 'registrationId',
    header: 'Registration ID',
    render: (row) => (
      <span className="font-mono text-xs" style={{ color: '#4A6A8A' }}>
        {row.id.slice(0, 8)}
      </span>
    ),
  },
];

export default function ArchivePage() {
  const router = useRouter();
  const { data, isLoading } = useRegistrations({ status: 'archived' });

  const registrations = data as Registration[] | { data: Registration[] } | undefined;
  const registrationList: Registration[] = Array.isArray(registrations)
    ? registrations
    : (registrations as { data?: Registration[] } | undefined)?.data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'DM Serif Display, serif', color: '#E8F0F8' }}>
          Archive
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>
          Archived regulatory records
        </p>
      </div>

      {/* Info banner */}
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
        }}
      >
        <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color: '#F59E0B' }} />
        <p className="text-sm" style={{ color: '#F59E0B' }}>
          Archived registrations are read-only.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={registrationList}
        isLoading={isLoading}
        emptyMessage="No archived registrations found."
        emptyIcon={<Archive className="h-8 w-8" />}
        keyExtractor={(r) => r.id}
        onRowClick={(r) => router.push(`/registrations/${r.id}`)}
      />
    </div>
  );
}
