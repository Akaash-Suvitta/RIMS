'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Clock, RefreshCw, TrendingUp } from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Badge, statusToBadgeVariant } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { getPortfolioHealth } from '../../../services/analytics.service';
import { listRegistrations } from '../../../services/registrations.service';
import { listSubmissions } from '../../../services/submissions.service';
import { listRenewals } from '../../../services/renewals.service';

function StatCard({
  icon,
  label,
  value,
  color,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  sublabel?: string;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: '#112238', border: '1px solid rgba(56, 189, 248, 0.12)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#7A9BBD' }}>
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold" style={{ color }}>
            {value}
          </p>
          {sublabel && (
            <p className="mt-0.5 text-xs" style={{ color: '#4A6A8A' }}>
              {sublabel}
            </p>
          )}
        </div>
        <div
          className="rounded-lg p-2"
          style={{ backgroundColor: `${color}18` }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['analytics', 'portfolio-health'],
    queryFn: getPortfolioHealth,
  });

  const { data: registrations, isLoading: regsLoading } = useQuery({
    queryKey: ['registrations', { limit: 5 }],
    queryFn: () => listRegistrations({ limit: 5 }),
  });

  const { data: submissions, isLoading: subsLoading } = useQuery({
    queryKey: ['submissions', { limit: 5 }],
    queryFn: () => listSubmissions({ limit: 5 }),
  });

  const { data: renewals, isLoading: renewalsLoading } = useQuery({
    queryKey: ['renewals', { limit: 5 }],
    queryFn: () => listRenewals({ limit: 5 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'DM Serif Display, serif', color: '#E8F0F8' }}>
          Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>
          Portfolio overview and recent activity
        </p>
      </div>

      {/* KPI strip */}
      {healthLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<CheckCircle className="h-5 w-5" style={{ color: '#10B981' }} />}
            label="Active Registrations"
            value={health?.byStatus?.active ?? 0}
            color="#10B981"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5" style={{ color: '#F43F5E' }} />}
            label="Expiring (90 days)"
            value={health?.expiringWithin90Days ?? 0}
            color="#F43F5E"
            sublabel="Action required"
          />
          <StatCard
            icon={<RefreshCw className="h-5 w-5" style={{ color: '#F59E0B' }} />}
            label="Pending Renewals"
            value={health?.overdueRenewals ?? 0}
            color="#F59E0B"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" style={{ color: '#38BDF8' }} />}
            label="Total Portfolio"
            value={health?.total ?? 0}
            color="#38BDF8"
          />
        </div>
      )}

      {/* Tables row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Registrations */}
        <Card>
          <CardHeader title="Recent Registrations" />
          {regsLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : (
            <div className="space-y-2">
              {registrations?.data?.slice(0, 5).map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: 'rgba(26, 51, 80, 0.4)' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#E8F0F8' }}>
                      {reg.registrationNumber ?? reg.id.slice(0, 8)}
                    </p>
                    <p className="text-xs" style={{ color: '#7A9BBD' }}>
                      {reg.registrationType}
                    </p>
                  </div>
                  <Badge variant={statusToBadgeVariant(reg.status)}>{reg.status}</Badge>
                </div>
              ))}
              {!registrations?.data?.length && (
                <p className="py-4 text-center text-sm" style={{ color: '#7A9BBD' }}>
                  No registrations yet
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Recent Submissions */}
        <Card>
          <CardHeader title="Recent Submissions" />
          {subsLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : (
            <div className="space-y-2">
              {submissions?.data?.slice(0, 5).map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: 'rgba(26, 51, 80, 0.4)' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#E8F0F8' }}>
                      {sub.internalRef ?? sub.id.slice(0, 8)}
                    </p>
                    <p className="text-xs" style={{ color: '#7A9BBD' }}>
                      {sub.submissionType}
                    </p>
                  </div>
                  <Badge variant={statusToBadgeVariant(sub.status)}>{sub.status}</Badge>
                </div>
              ))}
              {!submissions?.data?.length && (
                <p className="py-4 text-center text-sm" style={{ color: '#7A9BBD' }}>
                  No submissions yet
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Upcoming renewals */}
      <Card>
        <CardHeader title="Upcoming Renewals" subtitle="Next 90 days" />
        {renewalsLoading ? (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        ) : (
          <div className="space-y-2">
            {renewals?.data?.slice(0, 5).map((renewal) => (
              <div
                key={renewal.id}
                className="flex items-center justify-between rounded-lg px-3 py-2.5"
                style={{ backgroundColor: 'rgba(26, 51, 80, 0.4)' }}
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 flex-shrink-0" style={{ color: '#F59E0B' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#E8F0F8' }}>
                      {renewal.renewalNumber ?? renewal.id.slice(0, 8)}
                    </p>
                    <p className="text-xs font-mono" style={{ color: '#7A9BBD' }}>
                      Due: {renewal.targetSubmissionDate
                        ? new Date(renewal.targetSubmissionDate).toLocaleDateString()
                        : 'TBD'}
                    </p>
                  </div>
                </div>
                <Badge variant={statusToBadgeVariant(renewal.status)}>{renewal.status}</Badge>
              </div>
            ))}
            {!renewals?.data?.length && (
              <p className="py-4 text-center text-sm" style={{ color: '#7A9BBD' }}>
                No upcoming renewals
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
