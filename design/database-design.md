# RegAxis RIM — Database Design Document

Version: 1.0
Date: 2026-05-05
Status: Approved

---

## 1. Design Principles

| Principle | Decision |
|-----------|----------|
| **Primary keys** | `UUID` on all tables. `DEFAULT gen_random_uuid()` (PostgreSQL 13+ built-in; no extension needed). |
| **Multi-tenancy** | Row-level isolation via `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE` on every application table except `tenants` and reference tables (`countries`, `health_authorities`). |
| **Audit columns** | All mutable tables carry `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`, `created_by UUID REFERENCES users(id)`, `updated_by UUID REFERENCES users(id)`. |
| **Soft archive** | No `is_deleted` booleans. Use `archived_at TIMESTAMPTZ NULL` — `NULL` means active; a non-null value means archived. All default repository queries filter `AND archived_at IS NULL`. |
| **Timestamps** | Always `TIMESTAMPTZ` (UTC-aware). Never bare `TIMESTAMP`. |
| **Text fields** | `TEXT` unless a real database constraint exists (e.g. `CHAR(2)` for ISO codes). |
| **Enums** | PostgreSQL `CREATE TYPE ... AS ENUM` for every status/type field. Avoids magic strings in queries and enforces DB-level validation. |
| **Money / counts** | `NUMERIC(10,2)` for monetary values; `INTEGER` for counts. |
| **Unstructured data** | `JSONB` for metadata, milestones, conditions lists, and preference bags. |
| **No ON UPDATE CASCADE** | `updated_at` is maintained via a shared `trigger_set_updated_at()` trigger applied to all mutable tables. |
| **SQL safety** | All queries use parameterised `pg` placeholder syntax. Raw string interpolation into SQL is prohibited (TR-NF-024). |
| **Audit log immutability** | The `rims_app` database role is granted `INSERT` only on `audit_log`. `UPDATE` and `DELETE` are not granted (TR-C-003). |

---

## 2. PostgreSQL Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- full-text trigram search on document file names
```

`gen_random_uuid()` is built-in from PostgreSQL 13+; no `uuid-ossp` extension is required.

---

## 3. Enum Types

```sql
CREATE TYPE tenant_plan          AS ENUM ('trial', 'demo', 'professional', 'enterprise');
CREATE TYPE user_role            AS ENUM ('super_admin', 'regulatory_lead', 'regulatory_affairs_manager',
                                          'regulatory_affairs_specialist', 'dossier_manager',
                                          'submission_coordinator', 'labeling_specialist',
                                          'read_only', 'external_reviewer');
CREATE TYPE product_type         AS ENUM ('small_molecule', 'biologic', 'biosimilar', 'vaccine',
                                          'gene_therapy', 'medical_device', 'combination_product');
CREATE TYPE registration_status  AS ENUM ('pending', 'active', 'suspended', 'lapsed', 'archived');
CREATE TYPE submission_type      AS ENUM ('ctd', 'nda', 'maa', 'ind', 'bla', 'jnda',
                                          'variation', 'renewal_application', 'annual_report');
CREATE TYPE submission_status    AS ENUM ('draft', 'submitted', 'under_review',
                                          'approved', 'rejected', 'withdrawn');
CREATE TYPE renewal_status       AS ENUM ('upcoming', 'in_progress', 'submitted', 'approved', 'missed');
CREATE TYPE task_status          AS ENUM ('todo', 'in_progress', 'completed', 'blocked');
CREATE TYPE dossier_format       AS ENUM ('ectd_v3', 'ectd_v4', 'eu_ctd', 'j_ctd',
                                          'anvisa_edossier', 'cdsco_format', 'nmpa_ctd', 'non_ectd');
CREATE TYPE dossier_status       AS ENUM ('in_preparation', 'under_review', 'submission_ready',
                                          'submitted', 'archived');
CREATE TYPE module_status        AS ENUM ('not_started', 'in_progress', 'complete',
                                          'gap_identified', 'pending_review');
CREATE TYPE label_status         AS ENUM ('draft', 'review', 'approved', 'superseded');
CREATE TYPE label_type           AS ENUM ('uspi', 'smpc', 'ccds', 'jpi', 'pil',
                                          'patient_leaflet', 'prescribing_info');
CREATE TYPE translation_status   AS ENUM ('pending', 'in_progress', 'ai_draft_ready',
                                          'under_review', 'approved', 'flagged');
CREATE TYPE ha_query_status      AS ENUM ('open', 'in_progress', 'response_drafted',
                                          'response_submitted', 'closed', 'overdue');
CREATE TYPE ha_query_type        AS ENUM ('clinical', 'nonclinical', 'quality_cmc', 'labeling',
                                          'administrative', 'pharmacovigilance', 'rems', 'general');
CREATE TYPE variation_type       AS ENUM ('type_ia', 'type_ib', 'type_ii', 'prior_approval_supplement',
                                          'cbe_30', 'cbe_0', 'minor_change', 'major_change');
CREATE TYPE variation_status     AS ENUM ('planning', 'submitted', 'under_review',
                                          'approved', 'rejected', 'withdrawn');
CREATE TYPE response_source      AS ENUM ('manual', 'ai_generated', 'ai_assisted', 'template');
CREATE TYPE publishing_status    AS ENUM ('queued', 'in_progress', 'quality_check',
                                          'submitted', 'acknowledged', 'failed');
CREATE TYPE ai_insight_type      AS ENUM ('gap_detection', 'renewal_risk', 'query_assist',
                                          'market_gap', 'reg_watch');
CREATE TYPE ai_insight_severity  AS ENUM ('critical', 'high', 'medium', 'low', 'informational');
CREATE TYPE ai_insight_status    AS ENUM ('new', 'acknowledged', 'actioned', 'dismissed', 'expired');
CREATE TYPE ai_module_context    AS ENUM ('registration', 'renewal', 'submission',
                                          'dossier', 'labeling', 'general');
CREATE TYPE impact_level         AS ENUM ('critical', 'high', 'medium', 'low', 'monitoring');
CREATE TYPE notification_type    AS ENUM ('renewal_due', 'submission_update', 'task_assigned',
                                          'ai_complete', 'system');
```

---

## 4. Core Tables

### 4.1 tenants (root — no tenant_id)

```sql
CREATE TABLE tenants (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    slug         TEXT NOT NULL UNIQUE,               -- URL-safe identifier
    plan         tenant_plan NOT NULL DEFAULT 'trial',
    metadata     JSONB DEFAULT '{}',                 -- future: data_region, preferences
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

Notes: `slug` is used in Cognito custom attributes (`custom:org_id` stores the UUID; slug is for display). A `data_region` field will be added in Phase 3 for GDPR-strict EU tenants.

---

### 4.2 users

```sql
CREATE TABLE users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email          TEXT NOT NULL,
    cognito_sub    UUID NOT NULL UNIQUE,             -- Cognito JWT `sub` claim (TR-I-003)
    full_name      TEXT NOT NULL,
    role           user_role NOT NULL DEFAULT 'regulatory_affairs_specialist',
    phone          TEXT,
    department     TEXT,
    preferences    JSONB DEFAULT '{}',               -- timezone, notification prefs
    last_login_at  TIMESTAMPTZ,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, email)
);
```

Notes: `email` uniqueness is scoped per tenant. `cognito_sub` is globally unique (Cognito guarantees uniqueness across all user pools). `is_active` is replaced by `archived_at` on the tenant-scoped user deactivation flow — service layer sets `archived_at` and triggers Cognito account disable (TR-F-006).

---

### 4.3 countries (reference — no tenant_id)

```sql
CREATE TABLE countries (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iso2                 CHAR(2) NOT NULL UNIQUE,
    iso3                 CHAR(3) NOT NULL UNIQUE,
    country_name         TEXT NOT NULL,
    region               TEXT,
    regulatory_framework TEXT
);
```

Pre-populated via seed. 20 markets seeded from the original `rim_schema.sql` reference data.

---

### 4.4 health_authorities (reference — no tenant_id)

```sql
CREATE TABLE health_authorities (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id             UUID NOT NULL REFERENCES countries(id),
    code                   TEXT NOT NULL UNIQUE,         -- e.g. 'FDA', 'EMA'
    full_name              TEXT NOT NULL,
    acronym                TEXT,
    submission_portal_url  TEXT,
    ectd_version           TEXT,
    accepts_ectd           BOOLEAN DEFAULT TRUE,
    typical_review_days    INTEGER,
    fast_track_review_days INTEGER
);
```

Pre-populated via seed (12 HAs from original schema).

---

### 4.5 products

```sql
CREATE TABLE products (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    brand_name       TEXT,
    internal_code    TEXT,                             -- e.g. REGX-101
    inn              TEXT,                             -- International Nonproprietary Name
    atc_code         TEXT,
    product_type     product_type NOT NULL DEFAULT 'small_molecule',
    therapeutic_area TEXT,
    dosage_form      TEXT,
    strength         TEXT,
    route_of_admin   TEXT,
    metadata         JSONB DEFAULT '{}',
    created_by       UUID REFERENCES users(id),
    updated_by       UUID REFERENCES users(id),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    archived_at      TIMESTAMPTZ                       -- NULL = active
);
```

---

### 4.6 registrations

```sql
CREATE TABLE registrations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id          UUID NOT NULL REFERENCES products(id),
    country_id          UUID NOT NULL REFERENCES countries(id),
    ha_id               UUID NOT NULL REFERENCES health_authorities(id),
    owner_user_id       UUID REFERENCES users(id),
    registration_number TEXT,
    registration_type   TEXT NOT NULL,                  -- nda, maa, bla, etc.
    status              registration_status NOT NULL DEFAULT 'pending',
    approval_date       DATE,
    expiry_date         DATE,
    next_renewal_due    DATE,
    days_until_expiry   INTEGER GENERATED ALWAYS AS (
                            CASE WHEN expiry_date IS NOT NULL
                                 THEN (expiry_date - CURRENT_DATE)::INTEGER
                                 ELSE NULL END
                        ) STORED,
    renewal_initiated   BOOLEAN NOT NULL DEFAULT FALSE,
    lifecycle_stage     TEXT,
    notes               TEXT,
    metadata            JSONB DEFAULT '{}',
    created_by          UUID REFERENCES users(id),
    updated_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    archived_at         TIMESTAMPTZ,
    UNIQUE (tenant_id, product_id, country_id, ha_id, registration_number)
);
```

Notes: `days_until_expiry` is a generated stored column (read-only via API, TR-F-014). The unique constraint prevents duplicate registrations (TR-F-011).

---

### 4.7 registration_renewals

```sql
CREATE TABLE registration_renewals (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    registration_id          UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    renewal_number           TEXT,
    status                   renewal_status NOT NULL DEFAULT 'upcoming',
    initiated_date           DATE,
    target_submission_date   DATE,
    submitted_date           DATE,
    approved_date            DATE,
    renewal_expiry_date      DATE,
    assigned_to              UUID REFERENCES users(id),
    ai_package_generated     BOOLEAN DEFAULT FALSE,
    ai_package_generated_at  TIMESTAMPTZ,
    notes                    TEXT,
    created_by               UUID REFERENCES users(id),
    updated_by               UUID REFERENCES users(id),
    created_at               TIMESTAMPTZ DEFAULT NOW(),
    updated_at               TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4.8 registration_variations

```sql
CREATE TABLE registration_variations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    registration_id     UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    variation_number    TEXT,
    variation_type      variation_type NOT NULL,
    description         TEXT NOT NULL,
    status              variation_status NOT NULL DEFAULT 'planning',
    filed_date          DATE,
    approved_date       DATE,
    implementation_date DATE,
    created_by          UUID REFERENCES users(id),
    updated_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4.9 registration_conditions

```sql
CREATE TABLE registration_conditions (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    registration_id    UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    condition_text     TEXT NOT NULL,
    condition_category TEXT,
    due_date           DATE,
    fulfilled_date     DATE,
    status             task_status NOT NULL DEFAULT 'todo',
    notes              TEXT,
    created_by         UUID REFERENCES users(id),
    updated_by         UUID REFERENCES users(id),
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4.10 documents

```sql
CREATE TABLE documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    file_name           TEXT NOT NULL,
    display_name        TEXT,
    file_path           TEXT NOT NULL,                    -- S3 key: {tenant_id}/{entity}/{id}/{uuid}/{name}
    mime_type           TEXT NOT NULL,
    file_size_bytes     BIGINT,
    checksum_sha256     CHAR(64),
    document_status     TEXT NOT NULL DEFAULT 'draft',
    version             INTEGER NOT NULL DEFAULT 1,
    previous_version_id UUID REFERENCES documents(id),
    tags                TEXT[] DEFAULT '{}',
    ai_indexed          BOOLEAN DEFAULT FALSE,
    ai_indexed_at       TIMESTAMPTZ,
    is_archived         BOOLEAN NOT NULL DEFAULT FALSE,   -- TR-F-054: explicit archive flag kept for documents
    metadata            JSONB DEFAULT '{}',
    uploaded_by         UUID REFERENCES users(id),
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

Notes: `is_archived` is kept on documents (not `archived_at`) to match the explicit TR-F-054 requirement for document archival with `is_archived` flag. All other tables use `archived_at`.

---

### 4.11 dossiers

```sql
CREATE TABLE dossiers (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id        UUID NOT NULL REFERENCES products(id),
    target_ha_id      UUID REFERENCES health_authorities(id),
    name              TEXT NOT NULL,
    dossier_format    dossier_format NOT NULL DEFAULT 'ectd_v4',
    status            dossier_status NOT NULL DEFAULT 'in_preparation',
    completeness_pct  SMALLINT NOT NULL DEFAULT 0 CHECK (completeness_pct BETWEEN 0 AND 100),
    ai_last_scanned_at TIMESTAMPTZ,
    notes             TEXT,
    created_by        UUID REFERENCES users(id),
    updated_by        UUID REFERENCES users(id),
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW(),
    archived_at       TIMESTAMPTZ
);
```

---

### 4.12 dossier_modules

```sql
CREATE TABLE dossier_modules (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    dossier_id       UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
    parent_module_id UUID REFERENCES dossier_modules(id),
    module_code      TEXT NOT NULL,                      -- e.g. '3.2.S.4'
    title            TEXT NOT NULL,
    status           module_status NOT NULL DEFAULT 'not_started',
    sort_order       INTEGER NOT NULL DEFAULT 0,
    ai_gap_detected  BOOLEAN NOT NULL DEFAULT FALSE,
    gap_description  TEXT,
    notes            TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (dossier_id, module_code)
);
```

---

### 4.13 dossier_documents (junction)

```sql
CREATE TABLE dossier_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    module_id       UUID NOT NULL REFERENCES dossier_modules(id) ON DELETE CASCADE,
    document_id     UUID NOT NULL REFERENCES documents(id),
    ctd_path        TEXT,                                -- e.g. 'm3/32s/32s4/32s41'
    document_status TEXT NOT NULL DEFAULT 'draft',
    version_number  INTEGER NOT NULL DEFAULT 1,
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    linked_by       UUID REFERENCES users(id),
    linked_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (module_id, document_id)
);
```

---

### 4.14 submissions

```sql
CREATE TABLE submissions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id       UUID NOT NULL REFERENCES products(id),
    ha_id            UUID NOT NULL REFERENCES health_authorities(id),
    dossier_id       UUID REFERENCES dossiers(id),
    lead_user_id     UUID REFERENCES users(id),
    submission_number TEXT,
    internal_ref     TEXT,
    submission_type  submission_type NOT NULL,
    status           submission_status NOT NULL DEFAULT 'draft',
    target_file_date DATE,
    actual_file_date DATE,
    pdufa_date       DATE,                               -- FDA action / EMA opinion date
    acceptance_date  DATE,
    completeness_pct SMALLINT NOT NULL DEFAULT 0 CHECK (completeness_pct BETWEEN 0 AND 100),
    milestones       JSONB DEFAULT '[]',                 -- [{name, target_date, actual_date, status}]
    notes            TEXT,
    metadata         JSONB DEFAULT '{}',
    created_by       UUID REFERENCES users(id),
    updated_by       UUID REFERENCES users(id),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    archived_at      TIMESTAMPTZ
);
```

---

### 4.15 submission_documents (junction)

```sql
CREATE TABLE submission_documents (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    document_id   UUID NOT NULL REFERENCES documents(id),
    ctd_section   TEXT,
    document_role TEXT,
    sequence_order INTEGER DEFAULT 0,
    linked_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (submission_id, document_id)
);
```

---

### 4.16 submission_tasks

```sql
CREATE TABLE submission_tasks (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    submission_id    UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    assigned_user_id UUID REFERENCES users(id),
    title            TEXT NOT NULL,
    description      TEXT,
    status           task_status NOT NULL DEFAULT 'todo',
    due_date         DATE,
    completed_at     TIMESTAMPTZ,
    sort_order       INTEGER DEFAULT 0,
    created_by       UUID REFERENCES users(id),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4.17 ha_queries

```sql
CREATE TABLE ha_queries (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    submission_id         UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    ha_id                 UUID NOT NULL REFERENCES health_authorities(id),
    query_reference       TEXT,
    query_text            TEXT NOT NULL,
    query_type            ha_query_type NOT NULL DEFAULT 'general',
    status                ha_query_status NOT NULL DEFAULT 'open',
    received_date         DATE NOT NULL,
    due_date              DATE,
    response_date         DATE,
    ai_draft_ready        BOOLEAN NOT NULL DEFAULT FALSE,
    ai_draft_generated_at TIMESTAMPTZ,
    notes                 TEXT,
    created_by            UUID REFERENCES users(id),
    updated_by            UUID REFERENCES users(id),
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4.18 ha_query_responses

```sql
CREATE TABLE ha_query_responses (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    query_id         UUID NOT NULL REFERENCES ha_queries(id) ON DELETE CASCADE,
    drafted_by       UUID REFERENCES users(id),
    approved_by      UUID REFERENCES users(id),           -- required for ai_generated (TR-C-005)
    response_text    TEXT NOT NULL,
    source           response_source NOT NULL DEFAULT 'manual',
    approved         BOOLEAN NOT NULL DEFAULT FALSE,
    submitted        BOOLEAN NOT NULL DEFAULT FALSE,
    source_documents JSONB DEFAULT '[]',
    ai_model_version TEXT,
    drafted_at       TIMESTAMPTZ DEFAULT NOW(),
    approved_at      TIMESTAMPTZ,
    submitted_at     TIMESTAMPTZ
);
```

---

### 4.19 labels

```sql
CREATE TABLE labels (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id),
    market_id   UUID REFERENCES countries(id),
    label_type  label_type NOT NULL,
    status      label_status NOT NULL DEFAULT 'draft',
    created_by  UUID REFERENCES users(id),
    updated_by  UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, product_id, label_type, market_id)
);
```

---

### 4.20 label_versions

```sql
CREATE TABLE label_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    label_id        UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    document_id     UUID REFERENCES documents(id),
    version_number  INTEGER NOT NULL DEFAULT 1,
    version_label   TEXT,
    status          TEXT NOT NULL DEFAULT 'draft',
    change_summary  TEXT,
    ai_harmonized   BOOLEAN NOT NULL DEFAULT FALSE,
    ai_harmonized_at TIMESTAMPTZ,
    approved_by     UUID REFERENCES users(id),            -- electronic signature (TR-C-005)
    approved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (label_id, version_number)
);
```

---

### 4.21 label_translations

```sql
CREATE TABLE label_translations (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    label_id           UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    document_id        UUID REFERENCES documents(id),
    language_code      CHAR(5) NOT NULL,
    translation_status translation_status NOT NULL DEFAULT 'pending',
    ai_checked         BOOLEAN NOT NULL DEFAULT FALSE,
    ai_flag_notes      TEXT,
    translator_name    TEXT,
    reviewed_by        UUID REFERENCES users(id),
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (label_id, language_code)
);
```

---

### 4.22 ai_insights

```sql
CREATE TABLE ai_insights (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id              UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    insight_type           ai_insight_type NOT NULL,
    title                  TEXT NOT NULL,
    insight_text           TEXT NOT NULL,
    severity               ai_insight_severity NOT NULL DEFAULT 'medium',
    status                 ai_insight_status NOT NULL DEFAULT 'new',
    referenced_entity_type TEXT,
    referenced_entity_id   UUID,
    actioned_by            UUID REFERENCES users(id),
    actioned_at            TIMESTAMPTZ,
    ai_model_version       TEXT,
    confidence_score       NUMERIC(4,3) CHECK (confidence_score BETWEEN 0 AND 1),
    expires_at             TIMESTAMPTZ,
    generated_at           TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4.23 regulatory_intelligence (shared reference — no tenant_id)

```sql
CREATE TABLE regulatory_intelligence (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ha_id                UUID REFERENCES health_authorities(id),
    title                TEXT NOT NULL,
    summary              TEXT,
    full_text            TEXT,
    source_url           TEXT,
    impact_level         impact_level NOT NULL DEFAULT 'monitoring',
    published_date       DATE,
    effective_date       DATE,
    document_reference   TEXT,
    affected_categories  TEXT[] DEFAULT '{}',
    ai_summarized        BOOLEAN NOT NULL DEFAULT FALSE,
    ai_impact_analyzed   BOOLEAN NOT NULL DEFAULT FALSE,
    ai_summary_text      TEXT,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);
```

Notes: No `tenant_id` — regulatory intelligence is platform-wide reference data ingested from external feeds.

---

### 4.24 publishing_jobs

```sql
CREATE TABLE publishing_jobs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    submission_id       UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    dossier_id          UUID REFERENCES dossiers(id),
    job_reference       TEXT,
    format              dossier_format NOT NULL,
    status              publishing_status NOT NULL DEFAULT 'queued',
    published_by        UUID REFERENCES users(id),
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    acknowledgement_ref TEXT,
    error_log           TEXT,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4.25 audit_log (append-only)

```sql
CREATE TABLE audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,                             -- no FK — rows must survive tenant hard-delete edge cases
    user_id     UUID,
    action      TEXT NOT NULL,                             -- 'create', 'update', 'delete', 'view', 'export'
    entity_type TEXT NOT NULL,
    entity_id   UUID NOT NULL,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  INET,
    user_agent  TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Notes: No `created_at`/`updated_at` pattern — `occurred_at` is the single immutable timestamp. No FK on `tenant_id` — audit rows must persist even if a tenant is removed for compliance reasons. `rims_app` role: `INSERT` only (TR-C-003, TR-F-113).

---

### 4.26 notifications

```sql
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        notification_type NOT NULL,
    title       TEXT NOT NULL,
    body        TEXT,
    read_at     TIMESTAMPTZ,
    entity_type TEXT,
    entity_id   UUID,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Indexes

```sql
-- tenants
CREATE INDEX idx_tenants_slug ON tenants(slug);

-- users
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX idx_users_email ON users(email);

-- products
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_archived_at ON products(tenant_id) WHERE archived_at IS NULL;

-- registrations
CREATE INDEX idx_registrations_tenant_id ON registrations(tenant_id);
CREATE INDEX idx_registrations_product_id ON registrations(product_id);
CREATE INDEX idx_registrations_market_id ON registrations(country_id);
CREATE INDEX idx_registrations_ha_id ON registrations(ha_id);
CREATE INDEX idx_registrations_expiry_date ON registrations(expiry_date);
CREATE INDEX idx_registrations_tenant_status ON registrations(tenant_id, status);
CREATE INDEX idx_registrations_tenant_market ON registrations(tenant_id, country_id);
CREATE INDEX idx_registrations_tenant_product ON registrations(tenant_id, product_id);

-- registration_renewals
CREATE INDEX idx_renewals_tenant_id ON registration_renewals(tenant_id);
CREATE INDEX idx_renewals_registration_id ON registration_renewals(registration_id);
CREATE INDEX idx_renewals_tenant_due ON registration_renewals(tenant_id, target_submission_date);
CREATE INDEX idx_renewals_tenant_status ON registration_renewals(tenant_id, status);

-- registration_variations
CREATE INDEX idx_variations_tenant_id ON registration_variations(tenant_id);
CREATE INDEX idx_variations_registration_id ON registration_variations(registration_id);

-- registration_conditions
CREATE INDEX idx_conditions_tenant_id ON registration_conditions(tenant_id);
CREATE INDEX idx_conditions_registration_id ON registration_conditions(registration_id);

-- documents
CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX idx_documents_previous_version ON documents(previous_version_id);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_file_name_trgm ON documents USING GIN(file_name gin_trgm_ops);

-- dossiers
CREATE INDEX idx_dossiers_tenant_id ON dossiers(tenant_id);
CREATE INDEX idx_dossiers_product_id ON dossiers(product_id);

-- dossier_modules
CREATE INDEX idx_dossier_modules_tenant_id ON dossier_modules(tenant_id);
CREATE INDEX idx_dossier_modules_dossier_id ON dossier_modules(dossier_id);
CREATE INDEX idx_dossier_modules_parent ON dossier_modules(parent_module_id);
CREATE INDEX idx_dossier_modules_gap ON dossier_modules(ai_gap_detected) WHERE ai_gap_detected = TRUE;

-- dossier_documents
CREATE INDEX idx_dossier_documents_tenant_id ON dossier_documents(tenant_id);
CREATE INDEX idx_dossier_documents_module_id ON dossier_documents(module_id);

-- submissions
CREATE INDEX idx_submissions_tenant_id ON submissions(tenant_id);
CREATE INDEX idx_submissions_product_id ON submissions(product_id);
CREATE INDEX idx_submissions_ha_id ON submissions(ha_id);
CREATE INDEX idx_submissions_status ON submissions(tenant_id, status);
CREATE INDEX idx_submissions_pdufa_date ON submissions(pdufa_date);

-- submission_documents
CREATE INDEX idx_submission_docs_tenant_id ON submission_documents(tenant_id);
CREATE INDEX idx_submission_docs_submission_id ON submission_documents(submission_id);

-- submission_tasks
CREATE INDEX idx_submission_tasks_tenant_id ON submission_tasks(tenant_id);
CREATE INDEX idx_submission_tasks_submission_id ON submission_tasks(submission_id);
CREATE INDEX idx_submission_tasks_assigned_user ON submission_tasks(assigned_user_id);

-- ha_queries
CREATE INDEX idx_ha_queries_tenant_id ON ha_queries(tenant_id);
CREATE INDEX idx_ha_queries_submission_id ON ha_queries(submission_id);
CREATE INDEX idx_ha_queries_status ON ha_queries(status);
CREATE INDEX idx_ha_queries_due_date ON ha_queries(due_date);

-- ha_query_responses
CREATE INDEX idx_ha_responses_tenant_id ON ha_query_responses(tenant_id);
CREATE INDEX idx_ha_responses_query_id ON ha_query_responses(query_id);

-- labels
CREATE INDEX idx_labels_tenant_id ON labels(tenant_id);
CREATE INDEX idx_labels_product_id ON labels(product_id);

-- label_versions
CREATE INDEX idx_label_versions_tenant_id ON label_versions(tenant_id);
CREATE INDEX idx_label_versions_label_id ON label_versions(label_id);

-- label_translations
CREATE INDEX idx_label_translations_tenant_id ON label_translations(tenant_id);
CREATE INDEX idx_label_translations_label_id ON label_translations(label_id);

-- ai_insights
CREATE INDEX idx_ai_insights_tenant_id ON ai_insights(tenant_id);
CREATE INDEX idx_ai_insights_entity ON ai_insights(referenced_entity_type, referenced_entity_id);
CREATE INDEX idx_ai_insights_severity ON ai_insights(severity);
CREATE INDEX idx_ai_insights_status ON ai_insights(status);

-- regulatory_intelligence
CREATE INDEX idx_reg_intel_ha_id ON regulatory_intelligence(ha_id);
CREATE INDEX idx_reg_intel_impact ON regulatory_intelligence(impact_level);
CREATE INDEX idx_reg_intel_published ON regulatory_intelligence(published_date DESC);

-- publishing_jobs
CREATE INDEX idx_publishing_tenant_id ON publishing_jobs(tenant_id);
CREATE INDEX idx_publishing_submission_id ON publishing_jobs(submission_id);
CREATE INDEX idx_publishing_status ON publishing_jobs(status);

-- audit_log
CREATE INDEX idx_audit_tenant_id ON audit_log(tenant_id);
CREATE INDEX idx_audit_entity ON audit_log(tenant_id, entity_type, entity_id);
CREATE INDEX idx_audit_occurred_at ON audit_log(tenant_id, occurred_at DESC);
CREATE INDEX idx_audit_user_id ON audit_log(user_id);

-- notifications
CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(user_id, read_at) WHERE read_at IS NULL;
```

---

## 6. updated_at Trigger

Applied to all tables that carry `updated_at` (all except `audit_log`, `dossier_documents`, `label_versions`, `ha_query_responses`, and junction/append-only tables):

```sql
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

The trigger is created per-table in the migration file using a `DO $$ FOREACH` loop (as in `rim_schema.sql`). No `ON UPDATE CASCADE` is used anywhere.

---

## 7. Database Views

Views are defined in migration files alongside their tables.

| View | Purpose |
|------|---------|
| `vw_registrations_expiring` | Registrations with `days_until_expiry` between 0–180, joined with product, country, HA, and owner. Used by renewal dashboard (TR-F-020). |
| `vw_dossier_completeness` | Per-dossier module counts, gap counts, and `completeness_pct`. Used by dossier analytics (TR-F-045). |
| `vw_submission_pipeline` | Active (non-terminal) submissions with open HA query counts. Used by submission pipeline view (TR-F-036). |
| `vw_ha_queries_open` | Open / overdue HA queries with `days_remaining` computed column. |

All views filter `WHERE tenant_id = $1` when called from repositories — they are not relied on for tenant isolation; that remains the repository's responsibility.

---

## 8. Soft Archive Pattern

Active record query (repository default):
```sql
WHERE tenant_id = $1 AND archived_at IS NULL
```

Archive operation (service layer):
```sql
UPDATE products SET archived_at = NOW(), updated_by = $2 WHERE id = $1 AND tenant_id = $3;
-- followed by: AuditService.log({ action: 'archive', ... })
```

Archived record retrieval (explicit opt-in):
```sql
WHERE tenant_id = $1 AND archived_at IS NOT NULL
```

Tables using `archived_at`: `products`, `registrations`, `submissions`, `dossiers`.

Exception: `documents` uses `is_archived BOOLEAN` (TR-F-054 explicitly requires this flag name).

---

## 9. Migration Strategy

### File naming
```
apps/api/src/migrations/
  20260505_120000_create_enums.sql
  20260505_120001_create_tenants.sql
  20260505_120002_create_users.sql
  20260505_120003_create_countries_and_health_authorities.sql
  20260505_120004_create_products.sql
  20260505_120005_create_registrations.sql
  20260505_120006_create_registration_renewals_variations_conditions.sql
  20260505_120007_create_documents.sql
  20260505_120008_create_dossiers.sql
  20260505_120009_create_submissions.sql
  20260505_120010_create_labeling.sql
  20260505_120011_create_ai_and_intelligence.sql
  20260505_120012_create_publishing_audit_notifications.sql
  20260505_120013_create_indexes.sql
  20260505_120014_create_triggers_and_views.sql
  20260505_120015_seed_reference_data.sql
```

- Tool: `node-pg-migrate` (`npm run migrate` runs all pending migrations).
- Every file includes both `up` and `down` steps (TR-I-032).
- Migrations are idempotent: `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`.

### Seed data
```
apps/api/src/seeds/
  001_countries.sql        -- 20 countries from rim_schema.sql reference data
  002_health_authorities.sql -- 12 HAs from rim_schema.sql reference data
```

`npm run seed` runs seed files against the target database. Seeds use `INSERT ... ON CONFLICT DO NOTHING` to remain idempotent.

### Test database
- `PGDATABASE=rim_test` — separate database wiped and re-migrated per CI run.
- CI step: `npm run migrate && npm run seed` against `rim_test` before running Vitest integration tests.

---

## 10. Connection Pooling

| Setting | local | demo | production |
|---------|-------|------|------------|
| `pg.Pool max` | 10 | 5 | 10 per EC2 instance |
| Connection target | `localhost:5432` (Docker) | RDS Proxy endpoint | RDS Proxy endpoint |
| RDS Proxy | No | Yes (`cache.t3.micro` instance) | Yes (sized for load) |

Pool created once in `lib/services.ts` via `createDbClient(config)` and injected into all repositories. No repository creates its own connection.

```typescript
// apps/api/src/lib/services.ts
function createDbClient(cfg: Config): pg.Pool {
  return new pg.Pool({
    connectionString: cfg.DATABASE_URL,
    max: cfg.APP_ENV === 'demo' ? 5 : 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 2_000,
  });
}
```

---

## 11. Database Role Permissions

```sql
-- Application role (used by the running Express process)
CREATE ROLE rims_app LOGIN PASSWORD '...';
GRANT CONNECT ON DATABASE rims TO rims_app;
GRANT USAGE ON SCHEMA public TO rims_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rims_app;

-- Revoke mutation rights on audit_log (TR-C-003, TR-F-113)
REVOKE UPDATE, DELETE ON audit_log FROM rims_app;
```

A separate `rims_migration` role (used only during `npm run migrate`) holds `CREATE TABLE`, `CREATE INDEX`, and `ALTER TABLE` privileges.
