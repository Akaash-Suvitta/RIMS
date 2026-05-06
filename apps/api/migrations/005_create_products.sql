-- Migration 005: products table

CREATE TABLE IF NOT EXISTS products (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    brand_name       TEXT,
    internal_code    TEXT,
    inn              TEXT,
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
    archived_at      TIMESTAMPTZ
);
