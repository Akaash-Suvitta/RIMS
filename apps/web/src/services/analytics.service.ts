import { get } from '../lib/api';

const BASE = '/api/v1/analytics';

export interface PortfolioHealth {
  total: number;
  byStatus: { active: number; pending: number; suspended: number; lapsed: number; archived: number };
  expiringWithin90Days: number;
  overdueRenewals: number;
}

export interface RenewalCompliance {
  rate: number;
  byMarket: Record<string, { rate: number; total: number }>;
}

export interface SubmissionTimelines {
  avgDays: number;
  byType: Record<string, { avgDays: number; count: number }>;
  byHa: Record<string, { avgDays: number; benchmarkDays: number }>;
}

export function getPortfolioHealth(): Promise<PortfolioHealth> {
  return get<PortfolioHealth>(`${BASE}/portfolio-health`);
}

export function getRenewalCompliance(): Promise<RenewalCompliance> {
  return get<RenewalCompliance>(`${BASE}/renewal-compliance`);
}

export function getSubmissionTimelines(): Promise<SubmissionTimelines> {
  return get<SubmissionTimelines>(`${BASE}/submission-timelines`);
}
