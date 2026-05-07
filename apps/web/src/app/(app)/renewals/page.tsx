'use client';

import { RefreshCw } from 'lucide-react';
import { useRenewals } from '../../../hooks/useRenewals';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { Badge, statusToBadgeVariant } from '../../../components/ui/Badge';
import type { Renewal } from '@rim/types';

function DueDateCell({ date }: { date: string | Date | null | undefined }) {
  if (!date) return <span style={{ color: '#4A6A8A' }}>TBD</span>;
  const d = new Date(date);
  const daysLeft = Math.ceil((d.getTime() - Date.now()) / 86400000);
  const color = daysLeft <= 30 ? '#F43F5E' : daysLeft <= 90 ? '#F59E0B' : '#10B981';
  return (
    <div>
      <p className="font-mono text-xs" style={{ color: '#E8F0F8' }}>
        {d.toLocaleDateString()}
      </p>
      <p className="font-mono text-xs font-semibold" style={{ color }}>
        {daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
      </p>
    </div>
  );
}

const columns: Column<Renewal>[] = [
  {
    key: 'renewalNumber',
    header: 'Renewal ID',
    render: (row) => (
      <span className="font-mono text-xs" style={{ color: '#38BDF8' }}>
        {(row as Renewal & { renewalNumber?: string }).renewalNumber ?? row.id.slice(0, 8)}
      </span>
    ),
  },
  {
    key: 'registrationId',
    header: 'Registration',
    render: (row) => (
      <span className="font-mono text-xs" style={{ color: '#7A9BBD' }}>
        {row.registrationId.slice(0, 8)}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <Badge variant={statusToBadgeVariant(row.status)}>{row.status}</Badge>,
  },
  {
    key: 'targetSubmissionDate',
    header: 'Due Date',
    render: (row) => <DueDateCell date={row.targetSubmissionDate} />,
  },
  {
    key: 'submittedAt',
    header: 'Submitted',
    render: (row) => (
      <span className="font-mono text-xs" style={{ color: '#7A9BBD' }}>
        {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : '—'}
      </span>
    ),
  },
];

export default function RenewalsPage() {
  const { data, isLoading } = useRenewals({ limit: 25 });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'DM Serif Display, serif', color: '#E8F0F8' }}>
          Renewals
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>
          Track and manage registration renewal schedules
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        emptyMessage="No renewals scheduled. Renewals are created from registrations."
        emptyIcon={<RefreshCw className="h-8 w-8" />}
        keyExtractor={(r) => r.id}
      />
    </div>
  );
}
