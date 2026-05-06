-- Migration 008: dossiers, dossier_modules, and dossier_documents tables

CREATE TABLE IF NOT EXISTS dossiers (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id         UUID NOT NULL REFERENCES products(id),
    target_ha_id       UUID REFERENCES health_authorities(id),
    name               TEXT NOT NULL,
    dossier_format     dossier_format NOT NULL DEFAULT 'ectd_v4',
    status             dossier_status NOT NULL DEFAULT 'in_preparation',
    completeness_pct   SMALLINT NOT NULL DEFAULT 0 CHECK (completeness_pct BETWEEN 0 AND 100),
    ai_last_scanned_at TIMESTAMPTZ,
    notes              TEXT,
    created_by         UUID REFERENCES users(id),
    updated_by         UUID REFERENCES users(id),
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW(),
    archived_at        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS dossier_modules (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    dossier_id       UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
    parent_module_id UUID REFERENCES dossier_modules(id),
    module_code      TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS dossier_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    module_id       UUID NOT NULL REFERENCES dossier_modules(id) ON DELETE CASCADE,
    document_id     UUID NOT NULL REFERENCES documents(id),
    ctd_path        TEXT,
    document_status TEXT NOT NULL DEFAULT 'draft',
    version_number  INTEGER NOT NULL DEFAULT 1,
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    linked_by       UUID REFERENCES users(id),
    linked_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (module_id, document_id)
);
