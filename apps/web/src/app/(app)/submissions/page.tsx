'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus } from 'lucide-react';
import { useSubmissions } from '../../../hooks/useSubmissions';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { Badge, statusToBadgeVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import type { Submission } from '@rim/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const columns: Column<Submission>[] = [
  {
    key: 'ref',
    header: 'Reference',
    render: (row) => (
      <span className="font-mono text-xs" style={{ color: '#38BDF8' }}>
        {(row as Submission & { internalRef?: string }).internalRef ?? row.id.slice(0, 8)}
      </span>
    ),
  },
  {
    key: 'submissionType',
    header: 'Type',
    render: (row) => (
      <span className="text-sm uppercase" style={{ color: '#E8F0F8' }}>
        {(row as Submission & { submissionType?: string }).submissionType ?? '—'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <Badge variant={statusToBadgeVariant(row.status)}>{row.status}</Badge>,
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

export default function SubmissionsPage() {
  const router = useRouter();
  const [status, setStatus] = useState('');

  const { data, isLoading } = useSubmissions(status ? { status } : {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'DM Serif Display, serif', color: '#E8F0F8' }}>
            Submissions
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>
            {data?.total ?? 0} total submissions
          </p>
        </div>
        <Button variant="primary">
          <Plus className="h-4 w-4" />
          New Submission
        </Button>
      </div>

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
        emptyMessage="No submissions yet."
        emptyIcon={<FileText className="h-8 w-8" />}
        keyExtractor={(r) => r.id}
        onRowClick={(r) => router.push(`/submissions/${r.id}`)}
      />
    </div>
  );
}
