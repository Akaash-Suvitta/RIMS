'use client';

import { useRouter } from 'next/navigation';
import { Tag, Plus } from 'lucide-react';
import { useLabels } from '../../../hooks/useLabeling';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type { Label } from '@rim/types';

const columns: Column<Label>[] = [
  {
    key: 'product',
    header: 'Product',
    render: (row) => (
      <span className="font-mono text-xs" style={{ color: '#38BDF8' }}>
        {row.productId.slice(0, 8)}
      </span>
    ),
  },
  {
    key: 'market',
    header: 'Market',
    render: (row) => (
      <span className="font-mono text-xs" style={{ color: '#7A9BBD' }}>
        {row.marketId.slice(0, 8)}
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
    key: 'language',
    header: 'Language',
    render: (row) => (
      <span className="text-sm" style={{ color: '#E8F0F8' }}>
        {row.language}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => {
      const isApproved = !!row.approvedAt;
      return (
        <Badge variant={isApproved ? 'active' : 'draft'}>
          {isApproved ? 'approved' : 'draft'}
        </Badge>
      );
    },
  },
];

export default function LabelingPage() {
  const router = useRouter();
  const { data, isLoading } = useLabels();

  const labels = data as Label[] | { data: Label[] } | undefined;
  const labelList: Label[] = Array.isArray(labels)
    ? labels
    : (labels as { data?: Label[] } | undefined)?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'DM Serif Display, serif', color: '#E8F0F8' }}>
            Labeling
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>
            Manage product labels across markets
          </p>
        </div>
        <Button variant="primary" size="md">
          <Plus className="h-4 w-4" />
          New Label
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={labelList}
        isLoading={isLoading}
        emptyMessage="No labels yet. Create your first label to get started."
        emptyIcon={<Tag className="h-8 w-8" />}
        keyExtractor={(r) => r.id}
        onRowClick={(r) => router.push(`/labeling/${r.id}`)}
      />
    </div>
  );
}
