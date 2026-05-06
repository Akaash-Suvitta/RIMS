-- Migration 009: submissions, submission_documents, submission_tasks, ha_queries, ha_query_responses

CREATE TABLE IF NOT EXISTS submissions (
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
    pdufa_date       DATE,
    acceptance_date  DATE,
    completeness_pct SMALLINT NOT NULL DEFAULT 0 CHECK (completeness_pct BETWEEN 0 AND 100),
    milestones       JSONB DEFAULT '[]',
    notes            TEXT,
    metadata         JSONB DEFAULT '{}',
    created_by       UUID REFERENCES users(id),
    updated_by       UUID REFERENCES users(id),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    archived_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS submission_documents (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    submission_id  UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    document_id    UUID NOT NULL REFERENCES documents(id),
    ctd_section    TEXT,
    document_role  TEXT,
    sequence_order INTEGER DEFAULT 0,
    linked_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (submission_id, document_id)
);

CREATE TABLE IF NOT EXISTS submission_tasks (
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

CREATE TABLE IF NOT EXISTS ha_queries (
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

CREATE TABLE IF NOT EXISTS ha_query_responses (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    query_id         UUID NOT NULL REFERENCES ha_queries(id) ON DELETE CASCADE,
    drafted_by       UUID REFERENCES users(id),
    approved_by      UUID REFERENCES users(id),
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
