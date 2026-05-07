'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import {
  getPortfolioHealth,
  getRenewalCompliance,
  getSubmissionTimelines,
  type PortfolioHealth,
  type RenewalCompliance,
  type SubmissionTimelines,
} from '../../../services/analytics.service';

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: '#112238',
        border: '1px solid rgba(56, 189, 248, 0.12)',
      }}
    >
      <p className="text-sm" style={{ color: '#7A9BBD' }}>{label}</p>
      <p
        className="mt-2 text-3xl font-bold"
        style={{ color: color ?? '#E8F0F8', fontFamily: 'DM Serif Display, serif' }}
      >
        {value}
      </p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',
  pending: '#F59E0B',
  suspended: '#F43F5E',
  lapsed: '#7A9BBD',
  archived: '#4A6A8A',
};

export default function AnalyticsPage() {
  const portfolioQuery = useQuery<PortfolioHealth>({
    queryKey: ['analytics', 'portfolio-health'],
    queryFn: getPortfolioHealth,
  });

  const complianceQuery = useQuery<RenewalCompliance>({
    queryKey: ['analytics', 'renewal-compliance'],
    queryFn: getRenewalCompliance,
  });

  const timelinesQuery = useQuery<SubmissionTimelines>({
    queryKey: ['analytics', 'submission-timelines'],
    queryFn: getSubmissionTimelines,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'DM Serif Display, serif', color: '#E8F0F8' }}>
          Analytics
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>
          Portfolio health and compliance insights
        </p>
      </div>

      {/* Section 1: Portfolio Health */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: '#E8F0F8' }}>Portfolio Health</h2>
        {portfolioQuery.isLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : portfolioQuery.error || !portfolioQuery.data ? (
          <p className="text-sm" style={{ color: '#F43F5E' }}>Failed to load portfolio health.</p>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total Registrations" value={portfolioQuery.data.total} />
              <StatCard label="Active" value={portfolioQuery.data.byStatus.active} color="#10B981" />
              <StatCard label="Expiring (90d)" value={portfolioQuery.data.expiringWithin90Days} color="#F59E0B" />
              <StatCard label="Overdue Renewals" value={portfolioQuery.data.overdueRenewals} color="#F43F5E" />
            </div>

            {/* Status breakdown */}
            <Card>
              <p className="mb-4 text-sm font-semibold" style={{ color: '#E8F0F8' }}>Status Breakdown</p>
              <div className="space-y-3">
                {(Object.entries(portfolioQuery.data.byStatus) as [string, number][]).map(([status, count]) => {
                  const total = portfolioQuery.data!.total || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize" style={{ color: '#7A9BBD' }}>{status}</span>
                        <span style={{ color: '#E8F0F8' }}>{count}</span>
                      </div>
                      <div className="h-2 w-full rounded-full" style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)' }}>
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: STATUS_COLORS[status] ?? '#7A9BBD',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </section>

      {/* Section 2: Renewal Compliance */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: '#E8F0F8' }}>Renewal Compliance</h2>
        {complianceQuery.isLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : complianceQuery.error || !complianceQuery.data ? (
          <p className="text-sm" style={{ color: '#F43F5E' }}>Failed to load compliance data.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Big rate number */}
            <div
              className="flex flex-col items-center justify-center rounded-xl p-8"
              style={{ backgroundColor: '#112238', border: '1px solid rgba(56, 189, 248, 0.12)' }}
            >
              <p className="text-sm" style={{ color: '#7A9BBD' }}>Overall Compliance Rate</p>
              <p
                className="mt-3 text-5xl font-bold"
                style={{
                  color: complianceQuery.data.rate >= 80 ? '#10B981' : complianceQuery.data.rate >= 60 ? '#F59E0B' : '#F43F5E',
                  fontFamily: 'DM Serif Display, serif',
                }}
              >
                {Math.round(complianceQuery.data.rate)}%
              </p>
            </div>

            {/* Per-market table */}
            <Card>
              <p className="mb-3 text-sm font-semibold" style={{ color: '#E8F0F8' }}>By Market</p>
              {Object.keys(complianceQuery.data.byMarket).length === 0 ? (
                <p className="text-sm" style={{ color: '#4A6A8A' }}>No market data available.</p>
              ) : (
                <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Market', 'Rate', 'Total'].map((h) => (
                        <th key={h} className="pb-2 text-left text-xs font-semibold uppercase" style={{ color: '#7A9BBD' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.entries(complianceQuery.data.byMarket) as [string, { rate: number; total: number }][]).map(
                      ([market, stat]) => (
                        <tr key={market} style={{ borderTop: '1px solid rgba(56, 189, 248, 0.06)' }}>
                          <td className="py-2 font-mono text-xs" style={{ color: '#38BDF8' }}>{market}</td>
                          <td className="py-2" style={{ color: '#E8F0F8' }}>{Math.round(stat.rate)}%</td>
                          <td className="py-2" style={{ color: '#7A9BBD' }}>{stat.total}</td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        )}
      </section>

      {/* Section 3: Submission Timelines */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: '#E8F0F8' }}>Submission Timelines</h2>
        {timelinesQuery.isLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : timelinesQuery.error || !timelinesQuery.data ? (
          <p className="text-sm" style={{ color: '#F43F5E' }}>Failed to load timeline data.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Avg days */}
            <div
              className="flex flex-col items-center justify-center rounded-xl p-8"
              style={{ backgroundColor: '#112238', border: '1px solid rgba(56, 189, 248, 0.12)' }}
            >
              <BarChart2 className="h-8 w-8 mb-3" style={{ color: '#38BDF8' }} />
              <p className="text-sm" style={{ color: '#7A9BBD' }}>Avg Days to Submission</p>
              <p
                className="mt-2 text-5xl font-bold"
                style={{ color: '#38BDF8', fontFamily: 'DM Serif Display, serif' }}
              >
                {Math.round(timelinesQuery.data.avgDays)}
              </p>
              <p className="mt-1 text-xs" style={{ color: '#4A6A8A' }}>days</p>
            </div>

            {/* Per-type table */}
            <Card>
              <p className="mb-3 text-sm font-semibold" style={{ color: '#E8F0F8' }}>By Type</p>
              {Object.keys(timelinesQuery.data.byType).length === 0 ? (
                <p className="text-sm" style={{ color: '#4A6A8A' }}>No type data available.</p>
              ) : (
                <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Type', 'Avg Days', 'Count'].map((h) => (
                        <th key={h} className="pb-2 text-left text-xs font-semibold uppercase" style={{ color: '#7A9BBD' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.entries(timelinesQuery.data.byType) as [string, { avgDays: number; count: number }][]).map(
                      ([type, stat]) => (
                        <tr key={type} style={{ borderTop: '1px solid rgba(56, 189, 248, 0.06)' }}>
                          <td className="py-2 font-mono text-xs" style={{ color: '#38BDF8' }}>{type}</td>
                          <td className="py-2" style={{ color: '#E8F0F8' }}>{Math.round(stat.avgDays)}</td>
                          <td className="py-2" style={{ color: '#7A9BBD' }}>{stat.count}</td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
