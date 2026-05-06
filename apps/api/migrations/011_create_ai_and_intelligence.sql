-- Migration 011: ai_insights and regulatory_intelligence

CREATE TABLE IF NOT EXISTS ai_insights (
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

CREATE TABLE IF NOT EXISTS regulatory_intelligence (
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
