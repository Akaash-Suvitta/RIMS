-- Migration 006: registrations table and related child tables

CREATE TABLE IF NOT EXISTS registrations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id          UUID NOT NULL REFERENCES products(id),
    country_id          UUID NOT NULL REFERENCES countries(id),
    ha_id               UUID NOT NULL REFERENCES health_authorities(id),
    owner_user_id       UUID REFERENCES users(id),
    registration_number TEXT,
    registration_type   TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS registration_renewals (
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

CREATE TABLE IF NOT EXISTS registration_variations (
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

CREATE TABLE IF NOT EXISTS registration_conditions (
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
