import { query } from '../db/client.js';

export interface CountryRow {
  id: string;
  iso2: string;
  iso3: string;
  country_name: string;
  region: string | null;
  regulatory_framework: string | null;
}

export interface HealthAuthorityRow {
  id: string;
  country_id: string;
  code: string;
  full_name: string;
  acronym: string | null;
  submission_portal_url: string | null;
  ectd_version: string | null;
  accepts_ectd: boolean;
  typical_review_days: number | null;
  fast_track_review_days: number | null;
}

export interface MarketWithHAs extends CountryRow {
  healthAuthorities: HealthAuthorityRow[];
}

/**
 * Returns all markets (countries) with their nested health authorities.
 * This is reference data — not tenant-scoped.
 */
export async function listMarkets(): Promise<MarketWithHAs[]> {
  const countriesResult = await query<CountryRow>(
    'SELECT * FROM countries ORDER BY country_name ASC',
  );

  const hasResult = await query<HealthAuthorityRow>(
    'SELECT * FROM health_authorities ORDER BY full_name ASC',
  );

  const hasByCountry = new Map<string, HealthAuthorityRow[]>();
  for (const ha of hasResult.rows) {
    const list = hasByCountry.get(ha.country_id) ?? [];
    list.push(ha);
    hasByCountry.set(ha.country_id, list);
  }

  return countriesResult.rows.map((country) => ({
    ...country,
    healthAuthorities: hasByCountry.get(country.id) ?? [],
  }));
}

/**
 * Returns all health authorities, optionally filtered by country.
 */
export async function listHealthAuthorities(countryId?: string): Promise<HealthAuthorityRow[]> {
  if (countryId) {
    const result = await query<HealthAuthorityRow>(
      'SELECT * FROM health_authorities WHERE country_id = $1 ORDER BY full_name ASC',
      [countryId],
    );
    return result.rows;
  }
  const result = await query<HealthAuthorityRow>(
    'SELECT * FROM health_authorities ORDER BY full_name ASC',
  );
  return result.rows;
}
