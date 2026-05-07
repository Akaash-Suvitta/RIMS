'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Globe } from 'lucide-react';
import { useRegistrations } from '../../../hooks/useRegistrations';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { Badge, statusToBadgeVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import type { Registration } from '@rim/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'lapsed', label: 'Lapsed' },
  { value: 'archived', label: 'Archived' },
];

const columns: Column<Registration>[] = [
  {
    key: 'registrationNumber',
    header: 'Reg. Number',
    render: (row) => (
      <span className="font-mono text-xs" style={{ color: '#38BDF8' }}>
        {row.registrationNumber ?? row.id.slice(0, 8)}
      </span>
    ),
  },
  {
    key: 'type',
    header: 'Type',
    render: (row) => (
      <span className="text-sm" style={{ color: '#E8F0F8' }}>
        {row.registrationType}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <Badge variant={statusToBadgeVariant(row.status)}>{row.status}</Badge>
    ),
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
    key: 'daysUntilExpiry',
    header: 'Days Left',
    render: (row) => {
      const days = (row as Registration & { daysUntilExpiry?: number }).daysUntilExpiry;
      if (days == null) return <span style={{ color: '#4A6A8A' }}>—</span>;
      const color = days <= 30 ? '#F43F5E' : days <= 90 ? '#F59E0B' : '#10B981';
      return (
        <span className="font-mono text-xs font-semibold" style={{ color }}>
          {days}d
        </span>
      );
    },
  },
];

export default function RegistrationsPage() {
  const router = useRouter();
  const [status, setStatus] = useState('');

  const { data, isLoading } = useRegistrations(status ? { status: status as 'active' } : {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'DM Serif Display, serif', color: '#E8F0F8' }}>
            Registrations
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>
            {data?.total ?? 0} total registrations
          </p>
        </div>
        <Button variant="primary" size="md">
          <Plus className="h-4 w-4" />
          New Registration
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="w-44">
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        emptyMessage="No registrations yet. Create your first registration to get started."
        emptyIcon={<Globe className="h-8 w-8" />}
        keyExtractor={(r) => r.id}
        onRowClick={(r) => router.push(`/registrations/${r.id}`)}
      />
    </div>
  );
}
