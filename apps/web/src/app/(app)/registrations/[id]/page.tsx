'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useRegistration } from '../../../../hooks/useRegistrations';
import { Badge, statusToBadgeVariant } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { Spinner } from '../../../../components/ui/Spinner';

const TABS = ['Details', 'Renewals', 'Variations', 'Conditions', 'Documents', 'History'] as const;
type Tab = typeof TABS[number];

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5" style={{ borderBottom: '1px solid rgba(56, 189, 248, 0.08)' }}>
      <span className="text-sm" style={{ color: '#7A9BBD' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: '#E8F0F8' }}>{value || '—'}</span>
    </div>
  );
}

export default function RegistrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Details');
  const { data: reg, isLoading, error } = useRegistration(id);

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !reg) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-4">
        <p style={{ color: '#F43F5E' }}>Registration not found.</p>
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'DM Serif Display, serif', color: '#E8F0F8' }}>
                {reg.registrationNumber ?? reg.id.slice(0, 8)}
              </h1>
              <Badge variant={statusToBadgeVariant(reg.status)}>{reg.status}</Badge>
            </div>
            <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>
              {reg.registrationType}
            </p>
          </div>
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

      {/* Tab content */}
      {activeTab === 'Details' && (
        <Card>
          <DetailRow label="Registration Number" value={reg.registrationNumber ?? '—'} />
          <DetailRow label="Type" value={reg.registrationType} />
          <DetailRow label="Status" value={reg.status} />
          <DetailRow
            label="Approval Date"
            value={reg.firstApprovalDate ? new Date(reg.firstApprovalDate).toLocaleDateString() : '—'}
          />
          <DetailRow
            label="Expiry Date"
            value={reg.expiryDate ? new Date(reg.expiryDate).toLocaleDateString() : '—'}
          />
          <DetailRow
            label="Renewal Due"
            value={reg.renewalDueDate ? new Date(reg.renewalDueDate).toLocaleDateString() : '—'}
          />
          {reg.notes && <DetailRow label="Notes" value={reg.notes} />}
        </Card>
      )}

      {activeTab !== 'Details' && (
        <Card>
          <p className="py-6 text-center text-sm" style={{ color: '#7A9BBD' }}>
            {activeTab} content will be available in a future update.
          </p>
        </Card>
      )}
    </div>
  );
}
