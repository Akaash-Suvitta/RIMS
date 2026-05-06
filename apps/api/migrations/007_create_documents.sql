-- Migration 007: documents table

CREATE TABLE IF NOT EXISTS documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    file_name           TEXT NOT NULL,
    display_name        TEXT,
    file_path           TEXT NOT NULL,
    mime_type           TEXT NOT NULL,
    file_size_bytes     BIGINT,
    checksum_sha256     CHAR(64),
    document_status     TEXT NOT NULL DEFAULT 'draft',
    version             INTEGER NOT NULL DEFAULT 1,
    previous_version_id UUID REFERENCES documents(id),
    tags                TEXT[] DEFAULT '{}',
    ai_indexed          BOOLEAN DEFAULT FALSE,
    ai_indexed_at       TIMESTAMPTZ,
    is_archived         BOOLEAN NOT NULL DEFAULT FALSE,
    metadata            JSONB DEFAULT '{}',
    uploaded_by         UUID REFERENCES users(id),
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
