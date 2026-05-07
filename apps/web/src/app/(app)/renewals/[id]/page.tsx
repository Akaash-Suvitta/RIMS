'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useRenewal, useRenewalTasks } from '../../../../hooks/useRenewals';
import { Badge, statusToBadgeVariant } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { Spinner } from '../../../../components/ui/Spinner';
import type { Renewal, RenewalTask } from '@rim/types';

const TABS = ['Details', 'Tasks'] as const;
type Tab = typeof TABS[number];

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5" style={{ borderBottom: '1px solid rgba(56, 189, 248, 0.08)' }}>
      <span className="text-sm" style={{ color: '#7A9BBD' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: '#E8F0F8' }}>{value || '—'}</span>
    </div>
  );
}

function priorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return '#F43F5E';
    case 'high': return '#F59E0B';
    case 'medium': return '#38BDF8';
    case 'low': return '#7A9BBD';
    default: return '#7A9BBD';
  }
}

export default function RenewalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Details');

  const { data: renewal, isLoading, error } = useRenewal(id);
  const { data: tasks, isLoading: tasksLoading } = useRenewalTasks(id);

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !renewal) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-4">
        <p style={{ color: '#F43F5E' }}>Renewal not found.</p>
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Go back
        </Button>
      </div>
    );
  }

  const renewalWithNumber = renewal as Renewal & { renewalNumber?: string };
  const taskList = (tasks as RenewalTask[] | undefined) ?? [];

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
              {renewalWithNumber.renewalNumber ?? renewal.id.slice(0, 8)}
            </h1>
            <Badge variant={statusToBadgeVariant(renewal.status)}>{renewal.status}</Badge>
          </div>
          <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>Renewal detail</p>
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
          <DetailRow label="Registration ID" value={renewal.registrationId.slice(0, 8)} />
          <DetailRow label="Status" value={renewal.status} />
          <DetailRow
            label="Target Submission Date"
            value={renewal.targetSubmissionDate ? new Date(renewal.targetSubmissionDate).toLocaleDateString() : '—'}
          />
          <DetailRow
            label="Submitted At"
            value={renewal.submittedAt ? new Date(renewal.submittedAt).toLocaleDateString() : '—'}
          />
          <DetailRow
            label="Approved At"
            value={renewal.approvedAt ? new Date(renewal.approvedAt).toLocaleDateString() : '—'}
          />
          {renewal.notes && <DetailRow label="Notes" value={renewal.notes} />}
        </Card>
      )}

      {/* Tasks Tab */}
      {activeTab === 'Tasks' && (
        <div>
          {tasksLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Spinner />
            </div>
          ) : taskList.length === 0 ? (
            <Card>
              <p className="py-6 text-center text-sm" style={{ color: '#7A9BBD' }}>
                No tasks for this renewal.
              </p>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-xl" style={{ border: '1px solid rgba(56, 189, 248, 0.12)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(17, 34, 56, 0.8)', borderBottom: '1px solid rgba(56, 189, 248, 0.12)' }}>
                      {['Title', 'Priority', 'Status', 'Due Date'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#7A9BBD' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {taskList.map((task) => (
                      <tr key={task.id} style={{ borderBottom: '1px solid rgba(56, 189, 248, 0.08)' }}>
                        <td className="px-4 py-3" style={{ color: '#E8F0F8' }}>{task.title}</td>
                        <td className="px-4 py-3">
                          <span
                            className="rounded px-2 py-0.5 text-xs font-semibold"
                            style={{
                              color: priorityColor(task.priority),
                              backgroundColor: `${priorityColor(task.priority)}1A`,
                            }}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusToBadgeVariant(task.status)}>{task.status}</Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: '#7A9BBD' }}>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
