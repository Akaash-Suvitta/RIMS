-- Migration 012: publishing_jobs, audit_log, notifications

CREATE TABLE IF NOT EXISTS publishing_jobs (
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

-- audit_log is append-only; no updated_at column
CREATE TABLE IF NOT EXISTS audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    user_id     UUID,
    action      TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   UUID NOT NULL,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  INET,
    user_agent  TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
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
