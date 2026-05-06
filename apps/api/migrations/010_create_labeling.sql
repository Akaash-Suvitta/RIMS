-- Migration 010: labels, label_versions, label_translations

CREATE TABLE IF NOT EXISTS labels (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    market_id  UUID REFERENCES countries(id),
    label_type label_type NOT NULL,
    status     label_status NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, product_id, label_type, market_id)
);

CREATE TABLE IF NOT EXISTS label_versions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    label_id         UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    document_id      UUID REFERENCES documents(id),
    version_number   INTEGER NOT NULL DEFAULT 1,
    version_label    TEXT,
    status           TEXT NOT NULL DEFAULT 'draft',
    change_summary   TEXT,
    ai_harmonized    BOOLEAN NOT NULL DEFAULT FALSE,
    ai_harmonized_at TIMESTAMPTZ,
    approved_by      UUID REFERENCES users(id),
    approved_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (label_id, version_number)
);

CREATE TABLE IF NOT EXISTS label_translations (
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
