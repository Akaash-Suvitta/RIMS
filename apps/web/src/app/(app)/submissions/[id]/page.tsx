'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSubmission } from '../../../../hooks/useSubmissions';
import { Badge, statusToBadgeVariant } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { Spinner } from '../../../../components/ui/Spinner';
import type { Submission } from '@rim/types';

const TABS = ['Details', 'Documents', 'History'] as const;
type Tab = typeof TABS[number];

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5" style={{ borderBottom: '1px solid rgba(56, 189, 248, 0.08)' }}>
      <span className="text-sm" style={{ color: '#7A9BBD' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: '#E8F0F8' }}>{value || '—'}</span>
    </div>
  );
}

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Details');

  const { data: sub, isLoading, error } = useSubmission(id);

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-4">
        <p style={{ color: '#F43F5E' }}>Submission not found.</p>
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Go back
        </Button>
      </div>
    );
  }

  const subWithRef = sub as Submission & { referenceNumber?: string };
  const displayRef = subWithRef.referenceNumber ?? sub.id.slice(0, 8);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'DM Serif Display, serif', color: '#E8F0F8' }}>
              {displayRef}
            </h1>
            <Badge variant={statusToBadgeVariant(sub.status)}>{sub.status}</Badge>
          </div>
          <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>Submission detail</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid rgba(56, 189, 248, 0.12)' }}>
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                color: activeTab === tab ? '#00C2A8' : '#7A9BBD',
                borderBottom: activeTab === tab ? '2px solid #00C2A8' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Details Tab */}
      {activeTab === 'Details' && (
        <Card>
          <DetailRow label="Renewal ID" value={sub.renewalId ? sub.renewalId.slice(0, 8) : '—'} />
          <DetailRow label="Status" value={sub.status} />
          <DetailRow
            label="Submitted At"
            value={sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—'}
          />
          <DetailRow
            label="Acknowledged At"
            value={sub.acknowledgedAt ? new Date(sub.acknowledgedAt).toLocaleDateString() : '—'}
          />
        </Card>
      )}

      {activeTab !== 'Details' && (
        <Card>
          <p className="py-6 text-center text-sm" style={{ color: '#7A9BBD' }}>
            Content will be available in a future update.
          </p>
        </Card>
      )}
    </div>
  );
}
