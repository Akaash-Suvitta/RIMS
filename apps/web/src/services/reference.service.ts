import { get } from '../lib/api';
import type { Market } from '@rim/types';

export function listCountries(): Promise<Market[]> {
  return get<Market[]>('/api/v1/markets');
}

export function listHealthAuthorities(countryId?: string): Promise<{ id: string; code: string; fullName: string; acronym: string }[]> {
  if (countryId) {
    return get<{ id: string; code: string; fullName: string; acronym: string }[]>(`/api/v1/markets?country_id=${countryId}`).then(
      (markets) => markets.flatMap((m: Market & { healthAuthorities?: { id: string; code: string; fullName: string; acronym: string }[] }) => m.healthAuthorities ?? []),
    );
  }
  return get<{ id: string; code: string; fullName: string; acronym: string }[]>('/api/v1/markets').then(
    (markets) => (markets as (Market & { healthAuthorities?: { id: string; code: string; fullName: string; acronym: string }[] })[]).flatMap((m) => m.healthAuthorities ?? []),
  );
}
