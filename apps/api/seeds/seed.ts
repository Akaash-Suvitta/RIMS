/**
 * Seed script — populates dev/test data for every entity.
 * Must be run with APP_ENV=local (or any env with DATABASE_URL set).
 *
 * Idempotent: all inserts use ON CONFLICT DO NOTHING (reference data)
 * or ON CONFLICT ... DO UPDATE for mutable dev fixtures.
 *
 * Usage:  ts-node seeds/seed.ts
 */

import pg from 'pg';
import { config } from '../src/lib/config.js';

const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 2,
  connectionTimeoutMillis: 5_000,
});

// ─── Helper ───────────────────────────────────────────────────────────────────

async function q(client: pg.PoolClient, sql: string, values?: unknown[]): Promise<pg.QueryResult> {
  return client.query(sql, values);
}

// ─── Reference data ───────────────────────────────────────────────────────────

const COUNTRIES = [
  { iso2: 'US', iso3: 'USA', name: 'United States',        region: 'North America',  framework: 'FDA 21 CFR' },
  { iso2: 'EU', iso3: 'EUU', name: 'European Union',       region: 'Europe',         framework: 'EMA / EU Directive 2001/83/EC' },
  { iso2: 'GB', iso3: 'GBR', name: 'United Kingdom',       region: 'Europe',         framework: 'MHRA' },
  { iso2: 'JP', iso3: 'JPN', name: 'Japan',                region: 'Asia Pacific',   framework: 'PMDA / MHLW' },
  { iso2: 'CA', iso3: 'CAN', name: 'Canada',               region: 'North America',  framework: 'Health Canada' },
  { iso2: 'AU', iso3: 'AUS', name: 'Australia',            region: 'Asia Pacific',   framework: 'TGA' },
  { iso2: 'CH', iso3: 'CHE', name: 'Switzerland',          region: 'Europe',         framework: 'Swissmedic' },
  { iso2: 'BR', iso3: 'BRA', name: 'Brazil',               region: 'Latin America',  framework: 'ANVISA' },
  { iso2: 'IN', iso3: 'IND', name: 'India',                region: 'Asia Pacific',   framework: 'CDSCO' },
  { iso2: 'CN', iso3: 'CHN', name: 'China',                region: 'Asia Pacific',   framework: 'NMPA' },
  { iso2: 'KR', iso3: 'KOR', name: 'South Korea',          region: 'Asia Pacific',   framework: 'MFDS' },
  { iso2: 'SG', iso3: 'SGP', name: 'Singapore',            region: 'Asia Pacific',   framework: 'HSA' },
  { iso2: 'ZA', iso3: 'ZAF', name: 'South Africa',         region: 'Africa',         framework: 'SAHPRA' },
  { iso2: 'MX', iso3: 'MEX', name: 'Mexico',               region: 'Latin America',  framework: 'COFEPRIS' },
  { iso2: 'SA', iso3: 'SAU', name: 'Saudi Arabia',         region: 'Middle East',    framework: 'SFDA' },
  { iso2: 'AE', iso3: 'ARE', name: 'United Arab Emirates', region: 'Middle East',    framework: 'MOH UAE' },
  { iso2: 'NZ', iso3: 'NZL', name: 'New Zealand',          region: 'Asia Pacific',   framework: 'Medsafe' },
  { iso2: 'RU', iso3: 'RUS', name: 'Russia',               region: 'Europe/Asia',    framework: 'Roszdravnadzor' },
  { iso2: 'NO', iso3: 'NOR', name: 'Norway',               region: 'Europe',         framework: 'NoMA' },
  { iso2: 'SE', iso3: 'SWE', name: 'Sweden',               region: 'Europe',         framework: 'MPA (via EMA)' },
];

const HEALTH_AUTHORITIES = [
  { countryIso2: 'US', code: 'FDA',        fullName: 'U.S. Food and Drug Administration',                acronym: 'FDA',       portal: 'https://www.accessdata.fda.gov', ectdVersion: '3.2.2', reviewDays: 365, fastTrackDays: 180 },
  { countryIso2: 'EU', code: 'EMA',        fullName: 'European Medicines Agency',                        acronym: 'EMA',       portal: 'https://esubmission.ema.europa.eu', ectdVersion: '4.0', reviewDays: 210, fastTrackDays: 150 },
  { countryIso2: 'GB', code: 'MHRA',       fullName: 'Medicines and Healthcare products Regulatory Agency', acronym: 'MHRA',  portal: 'https://www.gov.uk/guidance/submissions-to-the-mhra', ectdVersion: '3.2.2', reviewDays: 150, fastTrackDays: 90 },
  { countryIso2: 'JP', code: 'PMDA',       fullName: 'Pharmaceuticals and Medical Devices Agency',       acronym: 'PMDA',      portal: 'https://www.pmda.go.jp', ectdVersion: '3.2.2', reviewDays: 300, fastTrackDays: 210 },
  { countryIso2: 'CA', code: 'HEALTH_CA',  fullName: 'Health Canada',                                    acronym: 'HC',        portal: 'https://www.canada.ca/en/health-canada', ectdVersion: '3.2.2', reviewDays: 300, fastTrackDays: 180 },
  { countryIso2: 'AU', code: 'TGA',        fullName: 'Therapeutic Goods Administration',                 acronym: 'TGA',       portal: 'https://www.tga.gov.au', ectdVersion: '3.2.2', reviewDays: 255, fastTrackDays: 150 },
  { countryIso2: 'CH', code: 'SWISSMEDIC', fullName: 'Swiss Agency of Therapeutic Products',             acronym: 'Swissmedic',portal: 'https://www.swissmedic.ch', ectdVersion: '3.2.2', reviewDays: 330, fastTrackDays: 210 },
  { countryIso2: 'BR', code: 'ANVISA',     fullName: 'Agência Nacional de Vigilância Sanitária',         acronym: 'ANVISA',    portal: 'https://www.gov.br/anvisa', ectdVersion: null, reviewDays: 365, fastTrackDays: 270 },
  { countryIso2: 'IN', code: 'CDSCO',      fullName: 'Central Drugs Standard Control Organisation',      acronym: 'CDSCO',     portal: 'https://cdsco.gov.in', ectdVersion: null, reviewDays: 365, fastTrackDays: 270 },
  { countryIso2: 'CN', code: 'NMPA',       fullName: 'National Medical Products Administration',         acronym: 'NMPA',      portal: 'https://www.nmpa.gov.cn', ectdVersion: null, reviewDays: 365, fastTrackDays: 270 },
  { countryIso2: 'KR', code: 'MFDS',       fullName: 'Ministry of Food and Drug Safety',                 acronym: 'MFDS',      portal: 'https://www.mfds.go.kr', ectdVersion: '3.2.2', reviewDays: 365, fastTrackDays: 270 },
  { countryIso2: 'SG', code: 'HSA',        fullName: 'Health Sciences Authority',                        acronym: 'HSA',       portal: 'https://www.hsa.gov.sg', ectdVersion: '3.2.2', reviewDays: 270, fastTrackDays: 180 },
];

// ─── Dev fixtures ─────────────────────────────────────────────────────────────

const DEV_TENANT = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'RegAxis Demo Org',
  slug: 'regaxis-demo',
  plan: 'professional' as const,
};

const DEV_USER = {
  id: '00000000-0000-0000-0000-000000000010',
  tenantId: DEV_TENANT.id,
  email: 'admin@regaxis-demo.local',
  cognitoSub: '00000000-0000-0000-0001-000000000001',
  fullName: 'Demo Admin',
  role: 'super_admin',
};

const DEV_PRODUCTS = [
  {
    id: '00000000-0000-0000-0000-000000000100',
    name: 'Cardiofast XR',
    brandName: 'Cardiofast',
    internalCode: 'REGX-101',
    inn: 'cardivastatin',
    atcCode: 'C10AA',
    productType: 'small_molecule',
    therapeuticArea: 'Cardiovascular',
    dosageForm: 'Extended-release tablet',
    strength: '40 mg',
    routeOfAdmin: 'Oral',
  },
  {
    id: '00000000-0000-0000-0000-000000000101',
    name: 'ImmunoBridge mAb',
    brandName: 'ImmunoBridge',
    internalCode: 'REGX-202',
    inn: 'immunobridumab',
    atcCode: 'L04AC',
    productType: 'biologic',
    therapeuticArea: 'Immunology',
    dosageForm: 'Solution for injection',
    strength: '150 mg/mL',
    routeOfAdmin: 'Subcutaneous',
  },
];

// ─── Seed runner ──────────────────────────────────────────────────────────────

async function seedCountries(client: pg.PoolClient): Promise<void> {
  console.log('  seeding countries…');
  for (const c of COUNTRIES) {
    await q(
      client,
      `INSERT INTO countries (iso2, iso3, country_name, region, regulatory_framework)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (iso2) DO NOTHING`,
      [c.iso2, c.iso3, c.name, c.region, c.framework],
    );
  }
}

async function seedHealthAuthorities(client: pg.PoolClient): Promise<void> {
  console.log('  seeding health_authorities…');
  for (const ha of HEALTH_AUTHORITIES) {
    const countryResult = await q(
      client,
      'SELECT id FROM countries WHERE iso2 = $1',
      [ha.countryIso2],
    );
    if (!countryResult.rows[0]) {
      console.warn(`    WARNING: country not found for iso2=${ha.countryIso2} — skipping ${ha.code}`);
      continue;
    }
    const countryId: string = countryResult.rows[0].id as string;
    await q(
      client,
      `INSERT INTO health_authorities
         (country_id, code, full_name, acronym, submission_portal_url,
          ectd_version, accepts_ectd, typical_review_days, fast_track_review_days)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (code) DO NOTHING`,
      [
        countryId,
        ha.code,
        ha.fullName,
        ha.acronym,
        ha.portal,
        ha.ectdVersion,
        ha.ectdVersion !== null,
        ha.reviewDays,
        ha.fastTrackDays,
      ],
    );
  }
}

async function seedDevTenant(client: pg.PoolClient): Promise<void> {
  console.log('  seeding dev tenant…');
  await q(
    client,
    `INSERT INTO tenants (id, name, slug, plan)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, plan = EXCLUDED.plan`,
    [DEV_TENANT.id, DEV_TENANT.name, DEV_TENANT.slug, DEV_TENANT.plan],
  );
}

async function seedDevUser(client: pg.PoolClient): Promise<void> {
  console.log('  seeding dev user…');
  await q(
    client,
    `INSERT INTO users
       (id, tenant_id, email, cognito_sub, full_name, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role`,
    [
      DEV_USER.id,
      DEV_USER.tenantId,
      DEV_USER.email,
      DEV_USER.cognitoSub,
      DEV_USER.fullName,
      DEV_USER.role,
    ],
  );
}

async function seedDevProducts(client: pg.PoolClient): Promise<void> {
  console.log('  seeding dev products…');
  for (const p of DEV_PRODUCTS) {
    await q(
      client,
      `INSERT INTO products
         (id, tenant_id, name, brand_name, internal_code, inn, atc_code,
          product_type, therapeutic_area, dosage_form, strength,
          route_of_admin, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [
        p.id,
        DEV_TENANT.id,
        p.name,
        p.brandName,
        p.internalCode,
        p.inn,
        p.atcCode,
        p.productType,
        p.therapeuticArea,
        p.dosageForm,
        p.strength,
        p.routeOfAdmin,
        DEV_USER.id,
      ],
    );
  }
}

async function seedDevRegistration(client: pg.PoolClient): Promise<void> {
  console.log('  seeding dev registration…');
  const usResult = await q(
    client,
    'SELECT id FROM countries WHERE iso2 = $1',
    ['US'],
  );
  const fdaResult = await q(
    client,
    'SELECT id FROM health_authorities WHERE code = $1',
    ['FDA'],
  );
  if (!usResult.rows[0] || !fdaResult.rows[0]) return;

  const countryId: string = usResult.rows[0].id as string;
  const haId: string = fdaResult.rows[0].id as string;

  await q(
    client,
    `INSERT INTO registrations
       (id, tenant_id, product_id, country_id, ha_id, owner_user_id,
        registration_number, registration_type, status,
        approval_date, expiry_date, next_renewal_due, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (id) DO NOTHING`,
    [
      '00000000-0000-0000-0000-000000000200',
      DEV_TENANT.id,
      DEV_PRODUCTS[0].id,
      countryId,
      haId,
      DEV_USER.id,
      'NDA-123456',
      'nda',
      'active',
      '2022-06-15',
      '2027-06-15',
      '2027-03-15',
      DEV_USER.id,
    ],
  );
}

async function run(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log('[seed] Starting…');
    await seedCountries(client);
    await seedHealthAuthorities(client);
    await seedDevTenant(client);
    await seedDevUser(client);
    await seedDevProducts(client);
    await seedDevRegistration(client);
    console.log('[seed] Done.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err: unknown) => {
  console.error('[seed] Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
