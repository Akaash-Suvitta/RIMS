'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useDossier, useDossierSections } from '../../../../hooks/useDossiers';
import { Badge, statusToBadgeVariant } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { Spinner } from '../../../../components/ui/Spinner';
import type { Dossier, DossierSection } from '@rim/types';

const TABS = ['Details', 'Sections'] as const;
type Tab = typeof TABS[number];

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5" style={{ borderBottom: '1px solid rgba(56, 189, 248, 0.08)' }}>
      <span className="text-sm" style={{ color: '#7A9BBD' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: '#E8F0F8' }}>{value || '—'}</span>
    </div>
  );
}

export default function DossierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Details');

  const { data: dossier, isLoading, error } = useDossier(id);
  const { data: sectionsData, isLoading: sectionsLoading } = useDossierSections(id);

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-4">
        <p style={{ color: '#F43F5E' }}>Dossier not found.</p>
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Go back
        </Button>
      </div>
    );
  }

  const d = dossier as Dossier;
  const sections = (sectionsData as DossierSection[] | { data: DossierSection[] } | undefined);
  const sectionList: DossierSection[] = Array.isArray(sections)
    ? sections
    : (sections as { data?: DossierSection[] } | undefined)?.data ?? [];

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
              {d.title}
            </h1>
            <Badge variant={statusToBadgeVariant(d.status)}>{d.status}</Badge>
            <span
              className="rounded px-2 py-0.5 text-xs font-mono"
              style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.2)' }}
            >
              v{d.version}
            </span>
          </div>
          <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>Dossier detail</p>
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
          <DetailRow label="Registration ID" value={d.registrationId ? d.registrationId.slice(0, 8) : '—'} />
          <DetailRow label="Version" value={String(d.version)} />
          <DetailRow label="Status" value={d.status} />
          <DetailRow label="Created By" value={d.createdBy ?? '—'} />
          <DetailRow label="Created At" value={new Date(d.createdAt).toLocaleDateString()} />
        </Card>
      )}

      {/* Sections Tab */}
      {activeTab === 'Sections' && (
        <div>
          {sectionsLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Spinner />
            </div>
          ) : sectionList.length === 0 ? (
            <Card>
              <p className="py-6 text-center text-sm" style={{ color: '#7A9BBD' }}>
                No sections yet.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {sectionList.map((section) => (
                <div
                  key={section.id}
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: '#112238',
                    border: '1px solid rgba(56, 189, 248, 0.12)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="text-lg"
                        style={{ color: section.isComplete ? '#10B981' : '#4A6A8A' }}
                        title={section.isComplete ? 'Complete' : 'Incomplete'}
                      >
                        {section.isComplete ? '✓' : '○'}
                      </span>
                      <div>
                        <p className="font-medium" style={{ color: '#E8F0F8' }}>{section.title}</p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: '#7A9BBD' }}>
                          {section.sectionCode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
